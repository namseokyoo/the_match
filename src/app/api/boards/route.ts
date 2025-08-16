import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/boards - 게시판 목록 조회
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        const { data: boards, error } = await supabase
            .from('boards')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching boards:', error);
            return NextResponse.json(
                { error: '게시판 목록을 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ boards });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}