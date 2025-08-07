-- 선수 통계 테이블 생성
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- 경기 기록
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    
    -- 득점 통계
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    points_scored INTEGER DEFAULT 0,  -- 농구 등 포인트 기반 스포츠
    
    -- 카드 및 페널티
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    
    -- 추가 통계
    minutes_played INTEGER DEFAULT 0,
    mvp_awards INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,  -- 골키퍼용
    
    -- 계산된 통계
    win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN games_played > 0 
            THEN (games_won::DECIMAL / games_played * 100)
            ELSE 0
        END
    ) STORED,
    
    goals_per_game DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN games_played > 0 
            THEN (goals_scored::DECIMAL / games_played)
            ELSE 0
        END
    ) STORED,
    
    -- 메타데이터
    season VARCHAR(20),
    sport_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 복합 유니크 키 (선수-경기 조합은 유일해야 함)
    UNIQUE(player_id, match_id)
);

-- 인덱스 생성
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_player_stats_team_id ON player_stats(team_id);
CREATE INDEX idx_player_stats_match_id ON player_stats(match_id);
CREATE INDEX idx_player_stats_season ON player_stats(season);
CREATE INDEX idx_player_stats_goals ON player_stats(goals_scored DESC);
CREATE INDEX idx_player_stats_points ON player_stats(points_scored DESC);
CREATE INDEX idx_player_stats_win_rate ON player_stats(win_rate DESC);

-- RLS 정책
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 통계를 볼 수 있음
CREATE POLICY "Public can view player stats" ON player_stats
    FOR SELECT
    USING (true);

-- 팀 주장과 경기 생성자만 통계 수정 가능
CREATE POLICY "Team captains and match creators can update stats" ON player_stats
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = player_stats.team_id
            AND teams.captain_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = player_stats.match_id
            AND tournaments.creator_id = auth.uid()
        )
    );

-- 통계 업데이트 트리거
CREATE OR REPLACE FUNCTION update_player_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_stats_updated_at
BEFORE UPDATE ON player_stats
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_updated_at();