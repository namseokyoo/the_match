import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/supabase-auth';

// GET /api/posts/[id]/comments - 댓글 목록 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseAdmin();
        const postId = params.id;

        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    email,
                    avatar_url
                )
            `)
            .eq('post_id', postId)
            .eq('is_deleted', false)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json(
                { error: '댓글을 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }

        // 대댓글 조회
        if (comments && comments.length > 0) {
            const commentIds = comments.map(c => c.id);
            const { data: replies } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:profiles!user_id (
                        id,
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .in('parent_id', commentIds)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });

            // 대댓글을 부모 댓글에 추가
            const repliesMap = new Map();
            replies?.forEach(reply => {
                if (!repliesMap.has(reply.parent_id)) {
                    repliesMap.set(reply.parent_id, []);
                }
                repliesMap.get(reply.parent_id).push(reply);
            });

            comments.forEach(comment => {
                comment.replies = repliesMap.get(comment.id) || [];
            });
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/posts/[id]/comments - 댓글 작성
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 인증 확인
        const user = await getAuthUser(request);
        
        if (!user || typeof user !== 'object' || !('id' in user)) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }
        
        const supabase = getSupabaseAdmin();
        const postId = params.id;
        const userId = (user as any).id;

        const body = await request.json();
        const { content, parent_id } = body;

        // 유효성 검사
        if (!content) {
            return NextResponse.json(
                { error: '댓글 내용을 입력해주세요.' },
                { status: 400 }
            );
        }

        // 댓글 생성
        const { data: comment, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content,
                parent_id: parent_id || null
            })
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    email,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return NextResponse.json(
                { error: '댓글 작성에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}