import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// POST /api/boards/seed - 기본 게시판 데이터 생성
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        // 기본 게시판 데이터
        const defaultBoards = [
            {
                name: '자유게시판',
                slug: 'free',
                description: '자유롭게 이야기를 나누는 공간입니다',
                icon: 'MessageSquare',
                order_index: 1,
                is_active: true
            },
            {
                name: '팀원모집',
                slug: 'recruit',
                description: '팀원을 모집하거나 팀을 찾는 공간입니다',
                icon: 'Users',
                order_index: 2,
                is_active: true
            },
            {
                name: '경기후기',
                slug: 'review',
                description: '경기 후기를 공유하는 공간입니다',
                icon: 'Trophy',
                order_index: 3,
                is_active: true
            }
        ];

        // 기존 게시판 확인
        const { data: existingBoards, error: checkError } = await supabase
            .from('boards')
            .select('slug');

        if (checkError) {
            console.error('Error checking boards:', checkError);
            return NextResponse.json(
                { error: '게시판 확인 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        const existingSlugs = existingBoards?.map(b => b.slug) || [];
        const boardsToInsert = defaultBoards.filter(
            board => !existingSlugs.includes(board.slug)
        );

        if (boardsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('boards')
                .insert(boardsToInsert);

            if (insertError) {
                console.error('Error inserting boards:', insertError);
                return NextResponse.json(
                    { error: '게시판 생성 중 오류가 발생했습니다.' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ 
            message: '기본 게시판이 생성되었습니다.',
            created: boardsToInsert.length,
            skipped: defaultBoards.length - boardsToInsert.length
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// GET /api/boards/seed - 게시판 상태 확인
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();

        const { data: boards, error } = await supabase
            .from('boards')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching boards:', error);
            return NextResponse.json(
                { error: '게시판 조회 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            boards: boards || [],
            count: boards?.length || 0
        });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}