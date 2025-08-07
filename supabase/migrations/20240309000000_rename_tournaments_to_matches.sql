-- tournaments 테이블을 matches로 이름 변경
ALTER TABLE tournaments RENAME TO matches;

-- 외래 키 제약 조건 업데이트
ALTER TABLE match_participants RENAME COLUMN tournament_id TO match_id;
ALTER TABLE match_results RENAME COLUMN tournament_id TO match_id;

-- 인덱스 이름 변경 (있는 경우)
ALTER INDEX IF EXISTS tournaments_pkey RENAME TO matches_pkey;
ALTER INDEX IF EXISTS tournaments_creator_id_idx RENAME TO matches_creator_id_idx;
ALTER INDEX IF EXISTS tournaments_status_idx RENAME TO matches_status_idx;

-- RLS 정책 이름 변경
ALTER POLICY IF EXISTS "Public tournaments are viewable by everyone." ON matches 
    RENAME TO "Public matches are viewable by everyone.";

ALTER POLICY IF EXISTS "Users can create tournaments." ON matches 
    RENAME TO "Users can create matches.";

ALTER POLICY IF EXISTS "Users can update their own tournaments." ON matches 
    RENAME TO "Users can update their own matches.";

ALTER POLICY IF EXISTS "Users can delete their own tournaments." ON matches 
    RENAME TO "Users can delete their own matches.";

-- 뷰나 함수가 있다면 업데이트 필요
-- 예: CREATE OR REPLACE VIEW active_matches AS SELECT * FROM matches WHERE status = 'in_progress';

-- 코멘트 업데이트
COMMENT ON TABLE matches IS 'Stores all match information (formerly tournaments table)';
COMMENT ON COLUMN matches.type IS 'Match type: single_elimination, double_elimination, round_robin, swiss, league';
COMMENT ON COLUMN matches.status IS 'Match status: draft, registration, in_progress, completed, cancelled';