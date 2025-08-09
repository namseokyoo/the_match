import { supabase } from './supabase';

export interface Game {
    id?: string;
    match_id: string;
    round: number;
    game_number: number;
    team1_id?: string;
    team2_id?: string;
    team1_score?: number;
    team2_score?: number;
    winner_id?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    venue?: string;
    next_game_id?: string;
    is_bye?: boolean;
    // 관계형 데이터
    team1?: {
        id: string;
        name: string;
        logo_url?: string;
    };
    team2?: {
        id: string;
        name: string;
        logo_url?: string;
    };
    winner?: {
        id: string;
        name: string;
    };
}

export interface TournamentBracket {
    rounds: Game[][];
    totalRounds: number;
    totalGames: number;
}

/**
 * 싱글 엘리미네이션 토너먼트 대진표 생성
 */
export async function createSingleEliminationBracket(
    matchId: string,
    teamIds: string[]
): Promise<TournamentBracket> {
    const teamCount = teamIds.length;
    
    // 2의 제곱수로 올림 (부전승 처리를 위해)
    const bracketPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const totalRounds = Math.log2(bracketPowerOfTwo);
    
    // 팀 배열 섞기 (랜덤 시딩)
    const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5);
    
    // 부전승을 위한 빈 슬롯 추가
    while (shuffledTeams.length < bracketPowerOfTwo) {
        shuffledTeams.push('');
    }
    
    const games: Game[] = [];
    const rounds: Game[][] = [];
    
    // 1라운드 생성
    const firstRoundGames: Game[] = [];
    let gameNumber = 1;
    
    for (let i = 0; i < bracketPowerOfTwo / 2; i++) {
        const team1 = shuffledTeams[i * 2] || '';
        const team2 = shuffledTeams[i * 2 + 1] || '';
        
        const game: Game = {
            match_id: matchId,
            round: 1,
            game_number: gameNumber++,
            team1_id: team1 || undefined,
            team2_id: team2 || undefined,
            status: 'scheduled',
            is_bye: !team1 || !team2,
        };
        
        // 부전승 처리
        if (game.is_bye) {
            game.winner_id = team1 || team2 || undefined;
            game.status = 'completed';
        }
        
        firstRoundGames.push(game);
        games.push(game);
    }
    rounds.push(firstRoundGames);
    
    // 나머지 라운드 생성
    let previousRoundGames = firstRoundGames;
    
    for (let round = 2; round <= totalRounds; round++) {
        const roundGames: Game[] = [];
        const gamesInRound = previousRoundGames.length / 2;
        
        for (let i = 0; i < gamesInRound; i++) {
            const game: Game = {
                match_id: matchId,
                round: round,
                game_number: gameNumber++,
                status: 'scheduled',
            };
            
            roundGames.push(game);
            games.push(game);
        }
        
        rounds.push(roundGames);
        previousRoundGames = roundGames;
    }
    
    // 다음 라운드 연결 설정
    for (let round = 0; round < rounds.length - 1; round++) {
        const currentRound = rounds[round];
        const nextRound = rounds[round + 1];
        
        for (let i = 0; i < currentRound.length; i += 2) {
            const nextGameIndex = Math.floor(i / 2);
            if (nextRound[nextGameIndex]) {
                currentRound[i].next_game_id = String(nextGameIndex);
                currentRound[i + 1].next_game_id = String(nextGameIndex);
            }
        }
    }
    
    // 데이터베이스에 저장
    const { error } = await supabase
        .from('games')
        .insert(games)
        .select();
    
    if (error) {
        console.error('Error creating bracket:', error);
        throw error;
    }
    
    return {
        rounds,
        totalRounds,
        totalGames: games.length,
    };
}

/**
 * 더블 엘리미네이션 토너먼트 대진표 생성
 */
export async function createDoubleEliminationBracket(
    matchId: string,
    teamIds: string[]
): Promise<TournamentBracket> {
    // 위너스 브라켓과 루저스 브라켓 생성
    const doubleElimGames: Game[] = [];
    const doubleElimRounds: Game[][] = [];
    
    // TODO: 더블 엘리미네이션 로직 구현
    // 복잡한 로직이므로 추후 구현
    
    return {
        rounds: doubleElimRounds,
        totalRounds: 0,
        totalGames: 0,
    };
}

/**
 * 리그전 (Round Robin) 대진표 생성
 */
export async function createRoundRobinSchedule(
    matchId: string,
    teamIds: string[],
    doubleRound: boolean = false // 홈/원정 2회전
): Promise<Game[]> {
    const games: Game[] = [];
    let gameNumber = 1;
    const rounds = doubleRound ? 2 : 1;
    
    for (let round = 1; round <= rounds; round++) {
        for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
                const game: Game = {
                    match_id: matchId,
                    round: round,
                    game_number: gameNumber++,
                    team1_id: round === 1 ? teamIds[i] : teamIds[j],
                    team2_id: round === 1 ? teamIds[j] : teamIds[i],
                    status: 'scheduled',
                };
                
                games.push(game);
            }
        }
    }
    
    // 데이터베이스에 저장
    const { error } = await supabase
        .from('games')
        .insert(games)
        .select();
    
    if (error) {
        console.error('Error creating round robin schedule:', error);
        throw error;
    }
    
    // 리그 순위표 초기화
    const standings = teamIds.map(teamId => ({
        match_id: matchId,
        team_id: teamId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        position: 0,
    }));
    
    await supabase
        .from('league_standings')
        .insert(standings);
    
    return games;
}

/**
 * 스위스 시스템 대진표 생성
 */
export async function createSwissSystemSchedule(
    matchId: string,
    teamIds: string[],
    rounds: number = 5
): Promise<Game[]> {
    const games: Game[] = [];
    
    // TODO: 스위스 시스템 로직 구현
    // 각 라운드마다 비슷한 성적의 팀끼리 매칭
    
    return games;
}

/**
 * 게임 결과 업데이트
 */
export async function updateGameResult(
    gameId: string,
    team1Score: number,
    team2Score: number,
    winnerId?: string
): Promise<void> {
    const { data: game, error: fetchError } = await supabase
        .from('games')
        .select('*, matches!inner(type)')
        .eq('id', gameId)
        .single();
    
    if (fetchError) {
        throw fetchError;
    }
    
    // 승자 결정
    let winner = winnerId;
    if (!winner) {
        if (team1Score > team2Score) {
            winner = game.team1_id;
        } else if (team2Score > team1Score) {
            winner = game.team2_id;
        }
    }
    
    // 게임 결과 업데이트
    const { error: updateError } = await supabase
        .from('games')
        .update({
            team1_score: team1Score,
            team2_score: team2Score,
            winner_id: winner,
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
        .eq('id', gameId);
    
    if (updateError) {
        throw updateError;
    }
    
    // 토너먼트인 경우 다음 라운드로 진출
    if (game.matches.type === 'single_elimination' && game.next_game_id && winner) {
        // 다음 라운드 게임 찾기
        const { data: nextGames } = await supabase
            .from('games')
            .select('*')
            .eq('match_id', game.match_id)
            .eq('round', game.round + 1);
        
        if (nextGames) {
            const nextGameIndex = parseInt(game.next_game_id);
            const nextGame = nextGames[nextGameIndex];
            
            if (nextGame) {
                // 다음 라운드 게임에 승자 배치
                const isFirstTeam = game.game_number % 2 === 1;
                await supabase
                    .from('games')
                    .update({
                        [isFirstTeam ? 'team1_id' : 'team2_id']: winner,
                    })
                    .eq('id', nextGame.id);
            }
        }
    }
    
    // 리그전인 경우 순위표 업데이트
    if (game.matches.type === 'round_robin') {
        await supabase.rpc('calculate_league_standings', {
            p_match_id: game.match_id,
        });
    }
}

/**
 * 대진표 가져오기
 */
export async function getBracket(matchId: string): Promise<Game[]> {
    const { data, error } = await supabase
        .from('games')
        .select(`
            *,
            team1:teams!games_team1_id_fkey(id, name, logo_url),
            team2:teams!games_team2_id_fkey(id, name, logo_url),
            winner:teams!games_winner_id_fkey(id, name)
        `)
        .eq('match_id', matchId)
        .order('round', { ascending: true })
        .order('game_number', { ascending: true });
    
    if (error) {
        console.error('Error fetching bracket:', error);
        throw error;
    }
    
    return data || [];
}

/**
 * 리그 순위표 가져오기
 */
export async function getLeagueStandings(matchId: string) {
    const { data, error } = await supabase
        .from('league_standings')
        .select(`
            *,
            team:teams!inner(id, name, logo_url)
        `)
        .eq('match_id', matchId)
        .order('position', { ascending: true });
    
    if (error) {
        console.error('Error fetching standings:', error);
        throw error;
    }
    
    return data || [];
}