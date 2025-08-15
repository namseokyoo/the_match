import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// POST /api/posts/[id]/like - 좋아요 토글
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseAdmin();
        const postId = params.id;
        
        // 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            );
        }

        // 기존 좋아요 확인
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // 좋아요 취소
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error removing like:', error);
                return NextResponse.json(
                    { error: '좋아요 취소에 실패했습니다.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ liked: false, message: '좋아요를 취소했습니다.' });
        } else {
            // 좋아요 추가
            const { error } = await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: user.id
                });

            if (error) {
                console.error('Error adding like:', error);
                return NextResponse.json(
                    { error: '좋아요에 실패했습니다.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ liked: true, message: '좋아요를 눌렀습니다.' });
        }
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}