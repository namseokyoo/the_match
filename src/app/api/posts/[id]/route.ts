import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/supabase-auth';

// GET /api/posts/[id] - 게시글 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseAdmin();
        const postId = params.id;

        // 게시글 조회
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                *,
                board:boards!board_id (
                    id,
                    name,
                    slug
                ),
                comments:comments(count),
                likes:likes!likes_post_id_fkey(count)
            `)
            .eq('id', postId)
            .eq('is_hidden', false)
            .single();

        if (error || !post) {
            return NextResponse.json(
                { error: '게시글을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 조회수 증가
        await supabase.rpc('increment_post_view_count', { post_id_param: postId });

        // 작성자 정보 가져오기
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', (post as any).user_id)
            .single();

        // 현재 사용자의 좋아요 여부 확인
        const { user } = await getAuthUser(request);
        
        if (user) {
            const { data: userLike } = await supabase
                .from('likes')
                .select('post_id')
                .eq('user_id', user.id)
                .eq('post_id', postId)
                .single();
            
            post.is_liked = !!userLike;
        }

        const processedPost: any = {
            ...post,
            user: profile || null,
            comments_count: (post as any).comments?.[0]?.count || 0,
            likes_count: (post as any).likes?.[0]?.count || 0
        };
        delete processedPost.comments;
        delete processedPost.likes;

        return NextResponse.json({ post: processedPost });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PUT /api/posts/[id] - 게시글 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseAdmin();
        const postId = params.id;
        
        // 인증 확인
        const { user, error: authError } = await getAuthUser(request);
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, content, board_id, tags } = body;

        // 유효성 검사
        if (!title || !content) {
            return NextResponse.json(
                { error: '필수 필드를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 게시글 수정 (RLS 정책에 의해 본인 글만 수정 가능)
        const { data: post, error } = await supabase
            .from('posts')
            .update({
                title,
                content,
                board_id: board_id,
                tags: tags || []
            })
            .eq('id', postId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error || !post) {
            return NextResponse.json(
                { error: '게시글 수정에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/posts/[id] - 게시글 삭제 (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseAdmin();
        const postId = params.id;
        
        // 인증 확인
        const { user, error: authError } = await getAuthUser(request);
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 게시글 soft delete (RLS 정책에 의해 본인 글만 삭제 가능)
        const { error } = await supabase
            .from('posts')
            .update({ is_hidden: true })
            .eq('id', postId)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json(
                { error: '게시글 삭제에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}