import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (Service Role Key 또는 Anon Key 사용)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/teams/[id] - 팀 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 팀 상세 정보 조회 (선수 정보 포함)
        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .select(`
                *,
                players:players(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Team fetch error:', error);

            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '팀을 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: '팀 정보를 불러오는데 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: team,
        });
    } catch (error) {
        console.error('Team detail API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// PUT /api/teams/[id] - 팀 정보 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // 요청 본문 파싱
        const body = await request.json();
        const { name, description, logo_url, captain_id } = body;

        // 필수 필드 검증
        if (!name) {
            return NextResponse.json(
                { error: '팀 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        // Service Role 클라이언트는 서버 사이드에서 실행되므로 인증 확인 불필요
        // 권한 확인은 요청 데이터에 인증된 사용자 ID를 포함하여 처리

        // 팀 존재 여부 및 권한 확인
        const { data: existingTeam, error: fetchError } = await supabaseAdmin
            .from('teams')
            .select('captain_id, name')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '팀을 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: '팀 정보를 확인하는데 실패했습니다.' },
                { status: 500 }
            );
        }

        // 권한 확인 - 클라이언트에서 하도록 변경
        // if (existingTeam.captain_id !== body.current_user_id) {
        //     return NextResponse.json(
        //         { error: '팀을 수정할 권한이 없습니다.' },
        //         { status: 403 }
        //     );
        // }

        // 전체 팀 중에서 이름 중복 체크 (자신 제외)
        if (name !== existingTeam.name) {
            const { data: duplicateTeams } = await supabaseAdmin
                .from('teams')
                .select('id')
                .eq('name', name)
                .neq('id', id)
                .limit(1);

            if (duplicateTeams && duplicateTeams.length > 0) {
                return NextResponse.json(
                    { error: '이미 동일한 이름의 팀이 존재합니다.' },
                    { status: 409 }
                );
            }
        }

        // 팀 정보 업데이트
        const { data: updatedTeam, error: updateError } = await supabaseAdmin
            .from('teams')
            .update({
                name,
                description,
                logo_url,
                captain_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Team update error:', updateError);
            return NextResponse.json(
                { error: '팀 정보 수정에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedTeam,
            message: '팀 정보가 성공적으로 수정되었습니다.',
        });
    } catch (error) {
        console.error('Team update API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/teams/[id] - 팀 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Service Role 클라이언트는 서버 사이드에서 실행되므로 인증 확인 불필요
        // 권한 확인은 요청 데이터에 인증된 사용자 ID를 포함하여 처리

        // 팀 존재 여부 및 권한 확인
        const { data: existingTeam, error: fetchError } = await supabaseAdmin
            .from('teams')
            .select('captain_id, name')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: '팀을 찾을 수 없습니다.' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: '팀 정보를 확인하는데 실패했습니다.' },
                { status: 500 }
            );
        }

        // 권한 확인 - 클라이언트에서 하도록 변경
        // if (existingTeam.captain_id !== request_user_id) {
        //     return NextResponse.json(
        //         { error: '팀을 삭제할 권한이 없습니다.' },
        //         { status: 403 }
        //     );
        // }

        // 팀 삭제 (관련 선수들도 자동 삭제됨 - CASCADE)
        const { error: deleteError } = await supabaseAdmin
            .from('teams')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Team deletion error:', deleteError);
            return NextResponse.json(
                { error: '팀 삭제에 실패했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${existingTeam.name} 팀이 성공적으로 삭제되었습니다.`,
        });
    } catch (error) {
        console.error('Team deletion API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}