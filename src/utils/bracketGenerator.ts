import { BracketMatch, BracketRound, TournamentBracket, BracketSeed } from '@/types/bracket';

/**
 * 토너먼트 브라켓 생성
 */
export function generateBracket(
    matchId: string,
    teams: BracketSeed[],
    type: TournamentBracket['type'] = 'single_elimination'
): TournamentBracket {
    if (type !== 'single_elimination') {
        // 현재는 싱글 엘리미네이션만 지원
        throw new Error('Currently only single elimination is supported');
    }

    const totalTeams = teams.length;
    const rounds = calculateRounds(totalTeams);
    const bracketRounds: BracketRound[] = [];

    // 첫 라운드 생성
    const firstRoundMatches = createFirstRound(teams);
    bracketRounds.push({
        round: 1,
        matches: firstRoundMatches,
    });

    // 이후 라운드 생성
    let previousRoundMatches = firstRoundMatches;
    for (let round = 2; round <= rounds; round++) {
        const roundMatches = createNextRound(previousRoundMatches, round);
        bracketRounds.push({
            round,
            matches: roundMatches,
        });
        previousRoundMatches = roundMatches;
    }

    return {
        matchId,
        type,
        rounds: bracketRounds,
        totalTeams,
        currentRound: 1,
    };
}

/**
 * 필요한 라운드 수 계산
 */
function calculateRounds(teamCount: number): number {
    return Math.ceil(Math.log2(teamCount));
}

/**
 * 다음 2의 제곱수 계산
 */
function nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * 첫 라운드 매치 생성
 */
function createFirstRound(teams: BracketSeed[]): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const bracketSize = nextPowerOfTwo(teams.length);

    // 시드 순서대로 팀 배치
    const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);
    
    // 브라켓 위치 계산 (높은 시드와 낮은 시드를 매칭)
    const positions: (BracketSeed | null)[] = new Array(bracketSize).fill(null);
    
    // BYE 처리 - 높은 시드 팀들이 BYE를 받음
    let teamIndex = 0;
    for (let i = 0; i < bracketSize; i++) {
        if (teamIndex < sortedTeams.length) {
            positions[i] = sortedTeams[teamIndex];
            teamIndex++;
        }
    }

    // 매치 생성
    for (let i = 0; i < bracketSize / 2; i++) {
        const match: BracketMatch = {
            id: `round-1-match-${i + 1}`,
            round: 1,
            position: i + 1,
            status: 'pending',
        };

        const topPosition = i;
        const bottomPosition = bracketSize - 1 - i;

        if (positions[topPosition]) {
            match.team1 = {
                id: positions[topPosition]!.teamId,
                name: positions[topPosition]!.teamName,
                seed: positions[topPosition]!.seed,
            };
        }

        if (positions[bottomPosition]) {
            match.team2 = {
                id: positions[bottomPosition]!.teamId,
                name: positions[bottomPosition]!.teamName,
                seed: positions[bottomPosition]!.seed,
            };
        }

        // BYE 처리 - 한 팀만 있으면 자동 승리
        if (match.team1 && !match.team2) {
            match.winner = match.team1.id;
            match.status = 'completed';
        } else if (!match.team1 && match.team2) {
            match.winner = match.team2.id;
            match.status = 'completed';
        }

        matches.push(match);
    }

    return matches;
}

/**
 * 다음 라운드 매치 생성
 */
function createNextRound(previousMatches: BracketMatch[], round: number): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const matchCount = Math.ceil(previousMatches.length / 2);

    for (let i = 0; i < matchCount; i++) {
        const match: BracketMatch = {
            id: `round-${round}-match-${i + 1}`,
            round,
            position: i + 1,
            status: 'pending',
        };

        // 이전 라운드의 매치와 연결
        const prevMatch1 = previousMatches[i * 2];
        const prevMatch2 = previousMatches[i * 2 + 1];

        if (prevMatch1) {
            prevMatch1.nextMatchId = match.id;
        }
        if (prevMatch2) {
            prevMatch2.nextMatchId = match.id;
        }

        matches.push(match);
    }

    return matches;
}

/**
 * 매치 업데이트 (점수, 승자 등)
 */
export function updateMatch(
    bracket: TournamentBracket,
    matchId: string,
    update: {
        team1Score?: number;
        team2Score?: number;
        winner?: string;
        status?: BracketMatch['status'];
    }
): TournamentBracket {
    const updatedBracket = { ...bracket };
    
    // 매치 찾기 및 업데이트
    for (const round of updatedBracket.rounds) {
        const match = round.matches.find(m => m.id === matchId);
        if (match) {
            if (update.team1Score !== undefined && match.team1) {
                match.team1.score = update.team1Score;
            }
            if (update.team2Score !== undefined && match.team2) {
                match.team2.score = update.team2Score;
            }
            if (update.winner) {
                match.winner = update.winner;
                match.status = 'completed';
                
                // 다음 라운드 매치에 승자 추가
                if (match.nextMatchId) {
                    advanceWinner(updatedBracket, match.nextMatchId, update.winner, match.position);
                }
            }
            if (update.status) {
                match.status = update.status;
            }
            break;
        }
    }
    
    return updatedBracket;
}

/**
 * 승자를 다음 라운드로 진출
 */
function advanceWinner(
    bracket: TournamentBracket,
    nextMatchId: string,
    winnerId: string,
    fromPosition: number
): void {
    for (const round of bracket.rounds) {
        const nextMatch = round.matches.find(m => m.id === nextMatchId);
        if (nextMatch) {
            // 이전 매치의 위치에 따라 team1 또는 team2로 배치
            const winnerTeam = findTeamById(bracket, winnerId);
            if (winnerTeam) {
                if (fromPosition % 2 === 1) {
                    nextMatch.team1 = winnerTeam;
                } else {
                    nextMatch.team2 = winnerTeam;
                }
            }
            break;
        }
    }
}

/**
 * 팀 ID로 팀 정보 찾기
 */
function findTeamById(
    bracket: TournamentBracket,
    teamId: string
): { id: string; name: string; score?: number } | null {
    for (const round of bracket.rounds) {
        for (const match of round.matches) {
            if (match.team1?.id === teamId) {
                return match.team1;
            }
            if (match.team2?.id === teamId) {
                return match.team2;
            }
        }
    }
    return null;
}