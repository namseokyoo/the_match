-- Games 테이블 (Match 내의 개별 경기)
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round INTEGER NOT NULL, -- 라운드 (1: 1라운드, 2: 2라운드, etc.)
    game_number INTEGER NOT NULL, -- 경기 번호
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    venue VARCHAR(255),
    notes TEXT,
    
    -- 토너먼트용 필드
    next_game_id UUID REFERENCES games(id) ON DELETE SET NULL, -- 다음 라운드 경기
    is_bye BOOLEAN DEFAULT FALSE, -- 부전승 여부
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(match_id, round, game_number)
);

-- 리그전용 추가 테이블 (순위표)
CREATE TABLE IF NOT EXISTS league_standings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    played INTEGER DEFAULT 0, -- 경기수
    won INTEGER DEFAULT 0, -- 승
    drawn INTEGER DEFAULT 0, -- 무
    lost INTEGER DEFAULT 0, -- 패
    goals_for INTEGER DEFAULT 0, -- 득점
    goals_against INTEGER DEFAULT 0, -- 실점
    goal_difference INTEGER DEFAULT 0, -- 득실차
    points INTEGER DEFAULT 0, -- 승점
    position INTEGER, -- 순위
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(match_id, team_id)
);

-- 게임 결과 상세 (세트 스코어 등)
CREATE TABLE IF NOT EXISTS game_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    UNIQUE(game_id, set_number)
);

-- 인덱스 생성
CREATE INDEX idx_games_match_id ON games(match_id);
CREATE INDEX idx_games_round ON games(round);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_scheduled_at ON games(scheduled_at);
CREATE INDEX idx_league_standings_match_id ON league_standings(match_id);
CREATE INDEX idx_league_standings_points ON league_standings(points DESC);
CREATE INDEX idx_game_sets_game_id ON game_sets(game_id);

-- RLS 정책
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sets ENABLE ROW LEVEL SECURITY;

-- games 정책
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

CREATE POLICY "Games can be created by match creator" ON games
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
        )
    );

CREATE POLICY "Games can be updated by match creator or team captains" ON games
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
            UNION
            SELECT captain_id FROM teams WHERE id IN (team1_id, team2_id)
        )
    );

CREATE POLICY "Games can be deleted by match creator" ON games
    FOR DELETE USING (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
        )
    );

-- league_standings 정책
CREATE POLICY "League standings are viewable by everyone" ON league_standings
    FOR SELECT USING (true);

CREATE POLICY "League standings can be managed by match creator" ON league_standings
    FOR ALL USING (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
        )
    );

-- game_sets 정책
CREATE POLICY "Game sets are viewable by everyone" ON game_sets
    FOR SELECT USING (true);

CREATE POLICY "Game sets can be managed by match creator or team captains" ON game_sets
    FOR ALL USING (
        auth.uid() IN (
            SELECT m.creator_id FROM matches m
            JOIN games g ON g.match_id = m.id
            WHERE g.id = game_id
            UNION
            SELECT captain_id FROM teams t
            JOIN games g ON g.team1_id = t.id OR g.team2_id = t.id
            WHERE g.id = game_id
        )
    );

-- 트리거: games 테이블 업데이트 시 updated_at 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_standings_updated_at BEFORE UPDATE ON league_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 리그 순위 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_league_standings(p_match_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 순위표 업데이트
    WITH game_results AS (
        SELECT 
            team_id,
            SUM(played) as played,
            SUM(won) as won,
            SUM(drawn) as drawn,
            SUM(lost) as lost,
            SUM(goals_for) as goals_for,
            SUM(goals_against) as goals_against
        FROM (
            -- 홈팀 결과
            SELECT 
                team1_id as team_id,
                1 as played,
                CASE 
                    WHEN team1_score > team2_score THEN 1 
                    ELSE 0 
                END as won,
                CASE 
                    WHEN team1_score = team2_score THEN 1 
                    ELSE 0 
                END as drawn,
                CASE 
                    WHEN team1_score < team2_score THEN 1 
                    ELSE 0 
                END as lost,
                team1_score as goals_for,
                team2_score as goals_against
            FROM games
            WHERE match_id = p_match_id 
            AND status = 'completed'
            AND team1_id IS NOT NULL
            
            UNION ALL
            
            -- 원정팀 결과
            SELECT 
                team2_id as team_id,
                1 as played,
                CASE 
                    WHEN team2_score > team1_score THEN 1 
                    ELSE 0 
                END as won,
                CASE 
                    WHEN team2_score = team1_score THEN 1 
                    ELSE 0 
                END as drawn,
                CASE 
                    WHEN team2_score < team1_score THEN 1 
                    ELSE 0 
                END as lost,
                team2_score as goals_for,
                team1_score as goals_against
            FROM games
            WHERE match_id = p_match_id 
            AND status = 'completed'
            AND team2_id IS NOT NULL
        ) as all_results
        GROUP BY team_id
    ),
    standings_calc AS (
        SELECT 
            team_id,
            played,
            won,
            drawn,
            lost,
            goals_for,
            goals_against,
            goals_for - goals_against as goal_difference,
            (won * 3) + drawn as points
        FROM game_results
    )
    INSERT INTO league_standings (
        match_id, team_id, played, won, drawn, lost,
        goals_for, goals_against, goal_difference, points
    )
    SELECT 
        p_match_id, team_id, played, won, drawn, lost,
        goals_for, goals_against, goal_difference, points
    FROM standings_calc
    ON CONFLICT (match_id, team_id) 
    DO UPDATE SET
        played = EXCLUDED.played,
        won = EXCLUDED.won,
        drawn = EXCLUDED.drawn,
        lost = EXCLUDED.lost,
        goals_for = EXCLUDED.goals_for,
        goals_against = EXCLUDED.goals_against,
        goal_difference = EXCLUDED.goal_difference,
        points = EXCLUDED.points;
    
    -- 순위 업데이트
    WITH ranked AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                ORDER BY points DESC, goal_difference DESC, goals_for DESC
            ) as position
        FROM league_standings
        WHERE match_id = p_match_id
    )
    UPDATE league_standings ls
    SET position = r.position
    FROM ranked r
    WHERE ls.id = r.id;
END;
$$ LANGUAGE plpgsql;