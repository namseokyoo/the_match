-- ===============================================
-- The Match: Add Missing Types and Update Existing
-- 필요한 타입들 추가 및 기존 타입 업데이트
-- ===============================================

-- 필요한 타입들 생성 (없는 경우만)
DO $$
BEGIN
    -- match_type 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_type') THEN
        CREATE TYPE match_type AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league');
        RAISE NOTICE 'match_type 타입을 생성했습니다.';
    END IF;
    
    -- match_status 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
        CREATE TYPE match_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
        RAISE NOTICE 'match_status 타입을 생성했습니다.';
    END IF;
    
    -- game_status 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status') THEN
        CREATE TYPE game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
        RAISE NOTICE 'game_status 타입을 생성했습니다.';
    END IF;
    
    -- participant_status 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_status') THEN
        CREATE TYPE participant_status AS ENUM ('pending', 'approved', 'rejected');
        RAISE NOTICE 'participant_status 타입을 생성했습니다.';
    END IF;
    
    -- media_type 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
        RAISE NOTICE 'media_type 타입을 생성했습니다.';
    END IF;
    
    -- user_role 타입 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'participant');
        RAISE NOTICE 'user_role 타입을 생성했습니다.';
    END IF;
END $$;