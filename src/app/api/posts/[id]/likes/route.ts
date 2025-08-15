import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/supabase-auth';

// GET /api/posts/[id]/likes - 좋아요 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const postId = params.id;
    
    // 현재 사용자 확인
    const user = await getAuthUser(request);
    
    // 전체 좋아요 수 조회
    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    
    if (countError) {
      console.error('Error fetching like count:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    
    // 사용자가 로그인한 경우 좋아요 여부 확인
    let isLiked = false;
    if (user) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', (user as any).id)
        .single();
      
      isLiked = !!userLike;
    }
    
    return NextResponse.json({
      count: count || 0,
      isLiked
    });
  } catch (error) {
    console.error('Error in GET /api/posts/[id]/likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/likes - 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    if (existingLike) {
      // 좋아요 취소
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', (existingLike as any).id);
      
      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      
      // 업데이트된 좋아요 수 조회
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      return NextResponse.json({
        liked: false,
        count: count || 0
      });
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId
        });
      
      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      
      // 업데이트된 좋아요 수 조회
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      return NextResponse.json({
        liked: true,
        count: count || 0
      });
    }
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}