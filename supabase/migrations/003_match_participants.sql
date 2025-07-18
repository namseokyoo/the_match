-- 경기 참가 관리 테이블 생성
CREATE TABLE IF NOT EXISTS match_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 한 팀은 한 경기에 한 번만 참가 신청 가능
    UNIQUE(match_id, team_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_team_id ON match_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_status ON match_participants(status);
CREATE INDEX IF NOT EXISTS idx_match_participants_applied_at ON match_participants(applied_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_match_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_match_participants_updated_at
    BEFORE UPDATE ON match_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_match_participants_updated_at();

-- RLS 정책 설정
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 참가 신청 내역을 볼 수 있음 (공개 정보)
CREATE POLICY "Anyone can view match participants" ON match_participants
    FOR SELECT USING (true);

-- 팀 주장만 자신의 팀으로 참가 신청 가능
CREATE POLICY "Team captains can apply for matches" ON match_participants
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM teams WHERE captain_id = auth.uid()
        )
    );

-- 팀 주장은 자신의 팀 참가 신청을 수정 가능 (pending 상태일 때만)
CREATE POLICY "Team captains can update their pending applications" ON match_participants
    FOR UPDATE USING (
        team_id IN (
            SELECT id FROM teams WHERE captain_id = auth.uid()
        ) AND status = 'pending'
    );

-- 팀 주장은 자신의 팀 참가 신청을 삭제 가능 (pending 상태일 때만)
CREATE POLICY "Team captains can delete their pending applications" ON match_participants
    FOR DELETE USING (
        team_id IN (
            SELECT id FROM teams WHERE captain_id = auth.uid()
        ) AND status = 'pending'
    );

-- 경기 주최자만 참가 신청을 승인/거부 가능
CREATE POLICY "Match creators can respond to applications" ON match_participants
    FOR UPDATE USING (
        match_id IN (
            SELECT id FROM tournaments WHERE creator_id = auth.uid()
        )
    );

-- 댓글
COMMENT ON TABLE match_participants IS '경기 참가 신청 및 관리';
COMMENT ON COLUMN match_participants.match_id IS '참가할 경기 ID';
COMMENT ON COLUMN match_participants.team_id IS '참가 신청 팀 ID';
COMMENT ON COLUMN match_participants.status IS '참가 신청 상태: pending(대기중), approved(승인됨), rejected(거부됨)';
COMMENT ON COLUMN match_participants.applied_at IS '참가 신청일';
COMMENT ON COLUMN match_participants.responded_at IS '승인/거부 응답일';
COMMENT ON COLUMN match_participants.response_by IS '승인/거부한 사용자 ID (경기 주최자)';
COMMENT ON COLUMN match_participants.notes IS '메모 (거부 사유, 특이사항 등)'; 