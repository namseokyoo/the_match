import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        const { data, error } = await supabase
            .from('match_templates')
            .select('*')
            .eq('id', params.id)
            .single();
        
        if (error) {
            console.error('Template fetch error:', error);
            return NextResponse.json(
                { error: '템플릿을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ data, success: true });
        
    } catch (error) {
        console.error('GET /api/templates/[id] error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        
        // 템플릿 업데이트 (RLS 정책에 의해 자신의 템플릿만 수정 가능)
        const { data, error } = await supabase
            .from('match_templates')
            .update(body)
            .eq('id', params.id)
            .select()
            .single();
        
        if (error) {
            console.error('Template update error:', error);
            return NextResponse.json(
                { error: '템플릿 수정에 실패했습니다.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({ data, success: true });
        
    } catch (error) {
        console.error('PUT /api/templates/[id] error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        
        // 템플릿 삭제 (RLS 정책에 의해 자신의 템플릿만 삭제 가능)
        const { error } = await supabase
            .from('match_templates')
            .delete()
            .eq('id', params.id);
        
        if (error) {
            console.error('Template delete error:', error);
            return NextResponse.json(
                { error: '템플릿 삭제에 실패했습니다.' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({ success: true });
        
    } catch (error) {
        console.error('DELETE /api/templates/[id] error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 템플릿 사용 시 사용 횟수 증가
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        
        // 사용 횟수 증가
        const { data: template, error: fetchError } = await supabase
            .from('match_templates')
            .select('usage_count')
            .eq('id', params.id)
            .single();
        
        if (fetchError) {
            return NextResponse.json(
                { error: '템플릿을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }
        
        const { error: updateError } = await supabase
            .from('match_templates')
            .update({ usage_count: (template.usage_count || 0) + 1 })
            .eq('id', params.id);
        
        if (updateError) {
            console.error('Usage count update error:', updateError);
        }
        
        return NextResponse.json({ success: true });
        
    } catch (error) {
        console.error('POST /api/templates/[id] error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}