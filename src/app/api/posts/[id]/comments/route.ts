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

        // 댓글 조회
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .eq('is_hidden', false)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json(
                { error: '댓글을 불러오는데 실패했습니다.', details: error.message },
                { status: 500 }
            );
        }

        // 댓글이 없으면 빈 배열 반환
        if (!comments || comments.length === 0) {
            return NextResponse.json({ comments: [] });
        }

        // 사용자 정보 조회
        const userIds = Array.from(new Set(comments.map(c => (c as any).user_id)));
        const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, id, username, email, avatar_url')
            .in('user_id', userIds);

        const profileMap = new Map();
        profiles?.forEach(profile => {
            profileMap.set(profile.user_id, profile);
        });

        // 댓글에 사용자 정보 추가
        const commentsWithProfiles = comments.map(comment => ({
            ...comment,
            profiles: profileMap.get((comment as any).user_id) || null
        }));

        // 대댓글 조회
        const commentIds = comments.map(c => (c as any).id);
        const { data: replies } = await supabase
            .from('comments')
            .select('*')
            .in('parent_id', commentIds)
            .eq('is_hidden', false)
            .order('created_at', { ascending: true });

        if (replies && replies.length > 0) {
            // 대댓글 사용자 정보 조회
            const replyUserIds = Array.from(new Set(replies.map(r => (r as any).user_id)));
            const { data: replyProfiles } = await supabase
                .from('profiles')
                .select('user_id, id, username, email, avatar_url')
                .in('user_id', replyUserIds);

            const replyProfileMap = new Map();
            replyProfiles?.forEach(profile => {
                replyProfileMap.set(profile.user_id, profile);
            });

            // 대댓글에 사용자 정보 추가
            const repliesWithProfiles = replies.map(reply => ({
                ...reply,
                profiles: replyProfileMap.get((reply as any).user_id) || null
            }));

            // 대댓글을 부모 댓글에 추가
            const repliesMap = new Map();
            repliesWithProfiles.forEach(reply => {
                if (!repliesMap.has((reply as any).parent_id)) {
                    repliesMap.set((reply as any).parent_id, []);
                }
                repliesMap.get((reply as any).parent_id).push(reply);
            });

            commentsWithProfiles.forEach((comment: any) => {
                comment.replies = repliesMap.get(comment.id) || [];
            });
        } else {
            commentsWithProfiles.forEach((comment: any) => {
                comment.replies = [];
            });
        }

        return NextResponse.json({ comments: commentsWithProfiles });
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
        
        if (!user) {
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
            .select()
            .single();

        if (error) {
            console.error('Error creating comment:', error);
            return NextResponse.json(
                { error: '댓글 작성에 실패했습니다.' },
                { status: 500 }
            );
        }

        // 사용자 정보 조회
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, id, username, email, avatar_url')
            .eq('user_id', userId)
            .single();

        const commentWithProfile = {
            ...comment,
            profiles: profile || null
        };

        return NextResponse.json({ comment: commentWithProfile }, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}