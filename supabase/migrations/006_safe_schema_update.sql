-- ===============================================
-- The Match: Safe Schema Update
-- 기존 테이블 구조 확인 후 안전하게 업데이트
-- ===============================================

-- 기존 테이블 구조 확인
DO $$
BEGIN
    -- 기존 테이블들이 있는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tournaments') THEN
        RAISE NOTICE 'tournaments 테이블이 존재합니다.';
        
        -- tournaments 테이블을 matches로 변경
        ALTER TABLE tournaments RENAME TO matches;
        RAISE NOTICE 'tournaments 테이블을 matches로 변경했습니다.';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') THEN
        RAISE NOTICE 'matches 테이블이 존재합니다.';
        
        -- matches 테이블을 games로 변경 (기존 matches가 실제 게임이었다면)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'matches' AND column_name = 'tournament_id') THEN
            ALTER TABLE matches RENAME TO games;
            ALTER TABLE games RENAME COLUMN tournament_id TO match_id;
            RAISE NOTICE 'matches 테이블을 games로 변경했습니다.';
        END IF;
    END IF;
    
    -- teams 테이블 컬럼 확인 및 업데이트
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teams' AND column_name = 'tournament_id') THEN
            ALTER TABLE teams RENAME COLUMN tournament_id TO match_id;
            RAISE NOTICE 'teams.tournament_id를 match_id로 변경했습니다.';
        END IF;
    END IF;
    
    -- 필요한 테이블들 생성 (없는 경우만)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            bio TEXT,
            social_links JSONB DEFAULT '{}',
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
        );
        RAISE NOTICE 'profiles 테이블을 생성했습니다.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        CREATE TABLE players (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            email TEXT,
            avatar_url TEXT,
            team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
            position TEXT,
            jersey_number INTEGER CHECK (jersey_number > 0),
            stats JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT players_jersey_number_team_unique UNIQUE (jersey_number, team_id)
        );
        RAISE NOTICE 'players 테이블을 생성했습니다.';
    END IF;
    
    RAISE NOTICE '스키마 업데이트 완료!';
END $$;