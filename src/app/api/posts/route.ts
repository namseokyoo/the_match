import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const searchParams = request.nextUrl.searchParams;
        
        const board_id = searchParams.get('board_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'latest';
        
        const offset = (page - 1) * limit;

        let query = supabase
            .from('posts')
            .select(`
                *,
                user:profiles!user_id (
                    id,
                    email,
                    full_name,
                    avatar_url
                ),
                board:boards!board_id (
                    id,
                    name,
                    slug
                ),
                comments:comments(count),
                likes:post_likes(count)
            `, { count: 'exact' })
            .eq('is_deleted', false);

        if (board_id) {
            query = query.eq('board_id', board_id);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        // 정렬
        switch (sort) {
            case 'popular':
                query = query.order('view_count', { ascending: false });
                break;
            case 'commented':
                // 댓글 수로 정렬하려면 추가 로직 필요
                query = query.order('created_at', { ascending: false });
                break;
            case 'latest':
            default:
                query = query.order('is_pinned', { ascending: false })
                           .order('created_at', { ascending: false });
        }

        // 페이지네이션
        query = query.range(offset, offset + limit - 1);

        const { data: posts, error, count } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            return NextResponse.json(
                { error: '게시글을 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }

        // 현재 사용자의 좋아요 여부 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && posts) {
            const postIds = posts.map(p => p.id);
            const { data: userLikes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds);
            
            const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
            
            posts.forEach(post => {
                const postAny = post as any;
                postAny.is_liked = likedPostIds.has(postAny.id);
                postAny.comments_count = postAny.comments?.[0]?.count || 0;
                postAny.likes_count = postAny.likes?.[0]?.count || 0;
                delete postAny.comments;
                delete postAny.likes;
            });
        }

        return NextResponse.json({
            posts: posts || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/posts - 게시글 작성
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        
        // 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { board_id, title, content, tags } = body;

        // 유효성 검사
        if (!board_id || !title || !content) {
            return NextResponse.json(
                { error: '필수 필드를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 게시글 생성
        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                board_id,
                user_id: user.id,
                title,
                content,
                tags: tags || []
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return NextResponse.json(
                { error: '게시글 작성에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}