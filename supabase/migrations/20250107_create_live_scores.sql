-- 실시간 경기 스코어 테이블
CREATE TABLE IF NOT EXISTS live_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    period VARCHAR(50), -- 쿼터, 세트, 하프 등
    period_time VARCHAR(20), -- 경기 시간 (예: "12:30")
    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, paused, finished
    scorer_id UUID REFERENCES profiles(id), -- 스코어 입력자
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 스코어 이벤트 기록 테이블 (득점 기록)
CREATE TABLE IF NOT EXISTS score_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_score_id UUID NOT NULL REFERENCES live_scores(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    event_type VARCHAR(50) NOT NULL, -- goal, point, score, penalty, etc.
    points INTEGER DEFAULT 1,
    description TEXT,
    event_time VARCHAR(20), -- 이벤트 발생 시간
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_live_scores_match_id ON live_scores(match_id);
CREATE INDEX idx_live_scores_status ON live_scores(status);
CREATE INDEX idx_score_events_live_score_id ON score_events(live_score_id);
CREATE INDEX idx_score_events_team_id ON score_events(team_id);

-- RLS 정책
ALTER TABLE live_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

-- live_scores 정책
CREATE POLICY "Live scores are viewable by everyone" ON live_scores
    FOR SELECT USING (true);

CREATE POLICY "Live scores can be created by match creator or team captains" ON live_scores
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
            UNION
            SELECT captain_id FROM teams WHERE id IN (team1_id, team2_id)
        )
    );

CREATE POLICY "Live scores can be updated by match creator or team captains" ON live_scores
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT creator_id FROM matches WHERE id = match_id
            UNION
            SELECT captain_id FROM teams WHERE id IN (team1_id, team2_id)
            UNION
            SELECT scorer_id FROM live_scores WHERE id = live_scores.id
        )
    );

-- score_events 정책
CREATE POLICY "Score events are viewable by everyone" ON score_events
    FOR SELECT USING (true);

CREATE POLICY "Score events can be created by authorized users" ON score_events
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT scorer_id FROM live_scores WHERE id = live_score_id
            UNION
            SELECT creator_id FROM matches m 
            JOIN live_scores ls ON ls.match_id = m.id 
            WHERE ls.id = live_score_id
        )
    );

CREATE POLICY "Score events can be deleted by creator" ON score_events
    FOR DELETE USING (auth.uid() = created_by);

-- 실시간 구독을 위한 함수
CREATE OR REPLACE FUNCTION notify_score_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'score_update',
        json_build_object(
            'match_id', NEW.match_id,
            'live_score_id', NEW.id,
            'team1_score', NEW.team1_score,
            'team2_score', NEW.team2_score,
            'status', NEW.status
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER on_score_update
    AFTER INSERT OR UPDATE ON live_scores
    FOR EACH ROW
    EXECUTE FUNCTION notify_score_update();