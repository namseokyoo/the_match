import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUserFromRequestObject } from '@/lib/supabase-server-client';

// GET /api/posts/[id]/likes - 좋아요 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const postId = params.id;
    
    // 현재 사용자 확인
    const user = await getAuthUserFromRequestObject(request);
    
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
        .eq('user_id', user.id)
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
      console.log('No user found in likes route');
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const supabase = getSupabaseAdmin();
    const postId = params.id;
    const userId = user.id;
    
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