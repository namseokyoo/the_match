-- 팀 가입 신청 테이블 생성
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 신청자 정보
    player_name TEXT NOT NULL,
    player_email TEXT,
    position TEXT,
    jersey_number INTEGER CHECK (jersey_number > 0),
    message TEXT, -- 가입 신청 메시지
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- 처리 정보
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_message TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 중복 신청 방지
    UNIQUE(team_id, user_id, status)
);

-- 인덱스 생성
CREATE INDEX idx_team_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX idx_team_join_requests_user_id ON team_join_requests(user_id);
CREATE INDEX idx_team_join_requests_status ON team_join_requests(status);
CREATE INDEX idx_team_join_requests_created_at ON team_join_requests(created_at DESC);

-- RLS 정책 설정
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 신청 내역을 볼 수 있음
CREATE POLICY "Users can view their own requests" ON team_join_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 팀 주장은 자신의 팀에 대한 모든 신청을 볼 수 있음
CREATE POLICY "Team captains can view team requests" ON team_join_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_join_requests.team_id
            AND teams.captain_id = auth.uid()
        )
    );

-- 인증된 사용자는 팀에 가입 신청할 수 있음
CREATE POLICY "Authenticated users can create join requests" ON team_join_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 팀 주장만 신청을 승인/거절할 수 있음
CREATE POLICY "Team captains can update requests" ON team_join_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_join_requests.team_id
            AND teams.captain_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_join_requests.team_id
            AND teams.captain_id = auth.uid()
        )
    );

-- 신청자는 자신의 대기중인 신청을 취소(삭제)할 수 있음
CREATE POLICY "Users can delete their pending requests" ON team_join_requests
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_team_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_join_requests_updated_at
BEFORE UPDATE ON team_join_requests
FOR EACH ROW
EXECUTE FUNCTION update_team_join_requests_updated_at();

-- 승인 시 자동으로 players 테이블에 추가하는 함수
CREATE OR REPLACE FUNCTION handle_team_join_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- 승인된 경우에만 처리
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- players 테이블에 추가
        INSERT INTO players (
            name,
            email,
            team_id,
            position,
            jersey_number,
            created_at,
            updated_at
        ) VALUES (
            NEW.player_name,
            NEW.player_email,
            NEW.team_id,
            NEW.position,
            NEW.jersey_number,
            TIMEZONE('utc', NOW()),
            TIMEZONE('utc', NOW())
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_team_join_approval_trigger
AFTER UPDATE ON team_join_requests
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
EXECUTE FUNCTION handle_team_join_approval();