-- 경기 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS match_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 경기 설정 (tournaments 테이블과 동일한 구조)
    type VARCHAR(50) NOT NULL,
    sport_type VARCHAR(50),
    max_teams INTEGER,
    min_teams INTEGER,
    rules JSONB,
    settings JSONB,
    
    -- 메타데이터
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_match_templates_creator ON match_templates(creator_id);
CREATE INDEX idx_match_templates_public ON match_templates(is_public);
CREATE INDEX idx_match_templates_name ON match_templates(name);

-- RLS 정책 설정
ALTER TABLE match_templates ENABLE ROW LEVEL SECURITY;

-- 공개 템플릿은 누구나 볼 수 있음
CREATE POLICY "Public templates are viewable by everyone" 
ON match_templates FOR SELECT 
USING (is_public = true);

-- 자신이 만든 템플릿은 볼 수 있음
CREATE POLICY "Users can view own templates" 
ON match_templates FOR SELECT 
USING (creator_id = auth.uid());

-- 로그인한 사용자는 템플릿 생성 가능
CREATE POLICY "Authenticated users can create templates" 
ON match_templates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

-- 자신의 템플릿만 수정 가능
CREATE POLICY "Users can update own templates" 
ON match_templates FOR UPDATE 
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- 자신의 템플릿만 삭제 가능
CREATE POLICY "Users can delete own templates" 
ON match_templates FOR DELETE 
USING (creator_id = auth.uid());

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_match_templates_updated_at 
BEFORE UPDATE ON match_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();