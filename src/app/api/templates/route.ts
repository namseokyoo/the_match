import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        // 인증 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        const searchParams = request.nextUrl.searchParams;
        const filter = searchParams.get('filter'); // 'mine' | 'public' | 'all'
        
        let query = supabase
            .from('match_templates')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (filter === 'mine' && user) {
            query = query.eq('creator_id', user.id);
        } else if (filter === 'public') {
            query = query.eq('is_public', true);
        } else if (filter === 'all' || !filter) {
            // 공개 템플릿과 자신의 템플릿만 볼 수 있음 (RLS 정책에 의해 처리됨)
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Templates fetch error:', error);
            return NextResponse.json(
                { error: '템플릿을 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({ data, success: true });
        
    } catch (error) {
        console.error('GET /api/templates error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        // 인증 확인
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            );
        }
        
        const body = await request.json();
        
        // 템플릿 생성
        const { data, error } = await supabase
            .from('match_templates')
            .insert({
                ...body,
                creator_id: user.id,
            })
            .select()
            .single();
        
        if (error) {
            console.error('Template creation error:', error);
            return NextResponse.json(
                { error: '템플릿 생성에 실패했습니다.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({ data, success: true });
        
    } catch (error) {
        console.error('POST /api/templates error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}