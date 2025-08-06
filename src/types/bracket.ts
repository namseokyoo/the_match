// 브라켓/대진표 관련 타입 정의

export interface BracketMatch {
    id: string;
    round: number;
    position: number;
    team1?: {
        id: string;
        name: string;
        score?: number;
    };
    team2?: {
        id: string;
        name: string;
        score?: number;
    };
    winner?: string; // 승자 팀 ID
    status: 'pending' | 'in_progress' | 'completed';
    nextMatchId?: string; // 다음 라운드 매치 ID
}

export interface BracketRound {
    round: number;
    matches: BracketMatch[];
}

export interface TournamentBracket {
    matchId: string;
    type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'group_stage';
    rounds: BracketRound[];
    totalTeams: number;
    currentRound: number;
}

// 대진표 생성 유틸리티 타입
export interface BracketSeed {
    teamId: string;
    teamName: string;
    seed: number; // 시드 번호 (1이 가장 높음)
}