import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Storage에 파일 업로드
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json(
                { error: '파일이 제공되지 않았습니다.' },
                { status: 400 }
            );
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: '파일 크기는 5MB 이하여야 합니다.' },
                { status: 400 }
            );
        }

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: '이미지 파일만 업로드 가능합니다.' },
                { status: 400 }
            );
        }

        // Supabase 클라이언트 생성
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 파일명 생성 (타임스탬프 + 랜덤 문자열)
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExt = file.name.split('.').pop();
        const fileName = `team-logos/${timestamp}-${randomString}.${fileExt}`;

        // ArrayBuffer로 변환
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
            .from('team-assets')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return NextResponse.json(
                { error: '파일 업로드에 실패했습니다.' },
                { status: 500 }
            );
        }

        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
            .from('team-assets')
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path
        });
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}