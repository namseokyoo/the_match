-- ===============================================
-- The Match: Clean Database Schema
-- Tournament → Match 용어 정리 및 정확한 스키마 구성
-- ===============================================

-- 기존 테이블 제거 (필요시)
DROP TABLE IF EXISTS bracket_nodes CASCADE;
DROP TABLE IF EXISTS user_tournaments CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 기존 타입 제거
DROP TYPE IF EXISTS tournament_type CASCADE;
DROP TYPE IF EXISTS tournament_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE match_type AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league');
CREATE TYPE match_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'participant');
CREATE TYPE participant_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table (extends auth.users)
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

-- Create matches table (기존 tournaments)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type match_type NOT NULL DEFAULT 'single_elimination',
    status match_status NOT NULL DEFAULT 'draft',
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_participants INTEGER CHECK (max_participants > 0),
    registration_deadline TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT matches_dates_check CHECK (
        (start_date IS NULL OR end_date IS NULL) OR (start_date <= end_date)
    ),
    CONSTRAINT matches_registration_deadline_check CHECK (
        registration_deadline IS NULL OR registration_deadline <= start_date
    )
);

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    captain_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT teams_name_match_unique UNIQUE (name, match_id)
);

-- Create players table
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
    
    CONSTRAINT players_jersey_number_team_unique UNIQUE (jersey_number, team_id),
    CONSTRAINT players_email_check CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create games table (기존 matches)
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round INTEGER,
    game_number INTEGER,
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status game_status NOT NULL DEFAULT 'scheduled',
    venue TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT games_different_teams_check CHECK (team1_id != team2_id),
    CONSTRAINT games_round_number_check CHECK (round IS NULL OR round > 0),
    CONSTRAINT games_game_number_check CHECK (game_number IS NULL OR game_number > 0),
    CONSTRAINT games_times_check CHECK (
        (started_at IS NULL OR completed_at IS NULL) OR (started_at <= completed_at)
    )
);

-- Create game_results table (기존 match_results)
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0 CHECK (team1_score >= 0),
    team2_score INTEGER DEFAULT 0 CHECK (team2_score >= 0),
    details JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT game_results_game_unique UNIQUE (game_id)
);

-- Create match_participants table (경기 참가 신청)
CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    status participant_status NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT match_participants_match_team_unique UNIQUE (match_id, team_id)
);

-- Create media table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    type media_type NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    file_size INTEGER CHECK (file_size > 0),
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_matches table (many-to-many with roles)
CREATE TABLE user_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'participant',
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT user_matches_unique UNIQUE (user_id, match_id)
);

-- Create bracket_nodes table (for match brackets)
CREATE TABLE bracket_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    round INTEGER NOT NULL CHECK (round > 0),
    position INTEGER NOT NULL CHECK (position > 0),
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    parent_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT bracket_nodes_match_round_position_unique UNIQUE (match_id, round, position)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_matches_creator_id ON matches(creator_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_type ON matches(type);
CREATE INDEX idx_matches_start_date ON matches(start_date);
CREATE INDEX idx_teams_match_id ON teams(match_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_games_match_id ON games(match_id);
CREATE INDEX idx_games_team1_id ON games(team1_id);
CREATE INDEX idx_games_team2_id ON games(team2_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_scheduled_at ON games(scheduled_at);
CREATE INDEX idx_game_results_game_id ON game_results(game_id);
CREATE INDEX idx_game_results_winner_id ON game_results(winner_id);
CREATE INDEX idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX idx_match_participants_team_id ON match_participants(team_id);
CREATE INDEX idx_match_participants_status ON match_participants(status);
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_match_id ON media(match_id);
CREATE INDEX idx_media_team_id ON media(team_id);
CREATE INDEX idx_media_game_id ON media(game_id);
CREATE INDEX idx_user_matches_user_id ON user_matches(user_id);
CREATE INDEX idx_user_matches_match_id ON user_matches(match_id);
CREATE INDEX idx_bracket_nodes_match_id ON bracket_nodes(match_id);
CREATE INDEX idx_bracket_nodes_game_id ON bracket_nodes(game_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_game_results_updated_at BEFORE UPDATE ON game_results FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_match_participants_updated_at BEFORE UPDATE ON match_participants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bracket_nodes_updated_at BEFORE UPDATE ON bracket_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();