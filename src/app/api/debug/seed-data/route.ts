import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
    try {
        // 테스트용 사용자 ID (실제로는 auth.users 테이블에서 가져와야 함)
        const testUserId = '66a5aaef-d3db-4439-8b89-2a36a336e161';

        // 테스트 매치 데이터
        const testMatches = [
            {
                title: '2025 봄 축구 토너먼트',
                description: '봄맞이 축구 대회입니다. 많은 참여 부탁드립니다!',
                type: 'single_elimination',
                status: 'registration',
                creator_id: testUserId,
                max_participants: 16,
                registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1주일 후
                start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2주일 후
                end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3주일 후
            },
            {
                title: '주말 농구 리그',
                description: '매주 주말에 진행되는 농구 리그입니다.',
                type: 'round_robin',
                status: 'in_progress',
                creator_id: testUserId,
                max_participants: 8,
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1주일 전
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
            },
            {
                title: '배드민턴 챔피언십',
                description: '실내 배드민턴 챔피언십',
                type: 'double_elimination',
                status: 'registration',
                creator_id: testUserId,
                max_participants: 32,
                registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                title: '탁구 마스터즈',
                description: '탁구 실력자들의 대결',
                type: 'swiss',
                status: 'completed',
                creator_id: testUserId,
                max_participants: 20,
                start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ];

        // 테스트 팀 데이터
        const testTeams = [
            {
                name: '번개 축구팀',
                description: '빠른 스피드를 자랑하는 축구팀입니다.',
                captain_id: testUserId,
            },
            {
                name: '농구 동호회',
                description: '매주 모여서 농구하는 동호회입니다. 신입 회원 모집중!',
                captain_id: testUserId,
            },
            {
                name: '배드민턴 클럽',
                description: '초보자도 환영합니다!',
                captain_id: testUserId,
            },
            {
                name: '탁구 마니아',
                description: '탁구를 사랑하는 사람들의 모임',
                captain_id: testUserId,
            },
            {
                name: '올스타 팀',
                description: '다양한 스포츠를 즐기는 팀',
                captain_id: testUserId,
            }
        ];

        // 매치 삽입
        const { data: insertedMatches, error: matchError } = await supabaseAdmin
            .from('matches')
            .insert(testMatches)
            .select();

        if (matchError) {
            console.error('Match insertion error:', matchError);
            return NextResponse.json({
                success: false,
                error: matchError.message
            }, { status: 500 });
        }

        // 팀 삽입
        const { data: insertedTeams, error: teamError } = await supabaseAdmin
            .from('teams')
            .insert(testTeams)
            .select();

        if (teamError) {
            console.error('Team insertion error:', teamError);
            return NextResponse.json({
                success: false,
                error: teamError.message
            }, { status: 500 });
        }

        // 일부 팀을 매치에 참가 신청
        if (insertedMatches && insertedTeams && insertedMatches.length > 0 && insertedTeams.length > 0) {
            const participations = [
                {
                    match_id: insertedMatches[0].id, // 축구 토너먼트
                    team_id: insertedTeams[0].id, // 번개 축구팀
                    status: 'approved'
                },
                {
                    match_id: insertedMatches[0].id,
                    team_id: insertedTeams[4].id, // 올스타 팀
                    status: 'pending'
                },
                {
                    match_id: insertedMatches[1].id, // 농구 리그
                    team_id: insertedTeams[1].id, // 농구 동호회
                    status: 'approved'
                },
                {
                    match_id: insertedMatches[2].id, // 배드민턴
                    team_id: insertedTeams[2].id, // 배드민턴 클럽
                    status: 'approved'
                }
            ];

            const { error: participationError } = await supabaseAdmin
                .from('match_participants')
                .insert(participations);

            if (participationError) {
                console.error('Participation insertion error:', participationError);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Test data created successfully',
            data: {
                matches: insertedMatches?.length || 0,
                teams: insertedTeams?.length || 0
            }
        });

    } catch (error) {
        console.error('Seed data error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}