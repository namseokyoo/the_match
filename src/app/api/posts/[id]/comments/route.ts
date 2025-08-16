import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUserFromRequestObject } from '@/lib/supabase-server-client';

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
        const userIds = Array.from(new Set(comments.map(c => (c as any).user_id).filter(Boolean)));
        if (userIds.length === 0) {
            return NextResponse.json({ comments: [] });
        }

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .in('id', userIds);

        const profileMap = new Map();
        profiles?.forEach(profile => {
            if (profile.id) {
                profileMap.set(profile.id, profile);
            }
        });

        // 댓글에 사용자 정보 추가
        const commentsWithProfiles = comments.map(comment => ({
            ...comment,
            user: profileMap.get((comment as any).user_id) || null
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
            const replyUserIds = Array.from(new Set(replies.map(r => (r as any).user_id).filter(Boolean)));
            const { data: replyProfiles } = await supabase
                .from('profiles')
                .select('id, email, full_name, avatar_url')
                .in('id', replyUserIds);

            const replyProfileMap = new Map();
            replyProfiles?.forEach(profile => {
                if (profile.id) {
                    replyProfileMap.set(profile.id, profile);
                }
            });

            // 대댓글에 사용자 정보 추가
            const repliesWithProfiles = replies.map(reply => ({
                ...reply,
                user: replyProfileMap.get((reply as any).user_id) || null
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
        // 먼저 getAuthUserFromRequestObject로 시도
        let user = await getAuthUserFromRequestObject(request);
        
        // 실패하면 Authorization 헤더에서 직접 확인
        if (!user) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const supabase = getSupabaseAdmin();
                const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
                if (!error && authUser) {
                    user = authUser;
                }
            }
        }
        
        if (!user) {
            console.log('No user found in comments route');
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }
        
        const supabase = getSupabaseAdmin();
        const postId = params.id;
        const userId = user.id;

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
            .select('id, email, full_name, avatar_url')
            .eq('id', userId)
            .single();

        const commentWithProfile = {
            ...comment,
            user: profile || null
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