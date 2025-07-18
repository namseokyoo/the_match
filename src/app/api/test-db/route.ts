import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 가장 간단한 테이블 조회 테스트
        const { data, error } = await supabase
            .from('teams')
            .select('count(*)')
            .limit(1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            data: data
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}