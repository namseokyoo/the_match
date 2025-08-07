import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ScoreInputClient from './ScoreInputClient';

interface ScorePageProps {
    params: { 
        id: string;  // matchId
        gameId: string;
    };
}

// 서버 컴포넌트에서 직접 Supabase 사용
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getGameData(matchId: string, gameId: string) {
    try {
        // 게임 정보 조회
        const { data: game, error: gameError } = await supabaseAdmin
            .from('games')
            .select(`
                *,
                team1:teams!games_team1_id_fkey(id, name, logo_url),
                team2:teams!games_team2_id_fkey(id, name, logo_url),
                match:matches!inner(id, title, type, creator_id)
            `)
            .eq('id', gameId)
            .eq('match_id', matchId)
            .single();

        if (gameError) {
            console.error('게임 조회 오류:', gameError);
            return null;
        }

        return game;
    } catch (error) {
        console.error('서버에서 게임 조회 오류:', error);
        return null;
    }
}

export default async function ScorePage({ params }: ScorePageProps) {
    const game = await getGameData(params.id, params.gameId);

    if (!game) {
        redirect(`/matches/${params.id}`);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <a href="/matches" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-match-blue">
                            경기
                        </a>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <a href={`/matches/${params.id}`} className="ml-1 text-sm font-medium text-gray-700 hover:text-match-blue md:ml-2">
                                {game.match.title}
                            </a>
                        </div>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                스코어 입력
                            </span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* 클라이언트 컴포넌트에 데이터 전달 */}
            <ScoreInputClient game={game} />
        </div>
    );
}