-- ===============================================
-- The Match: Fixed Database Schema for Supabase
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE tournament_type AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE media_type AS ENUM ('image', 'video', 'document');
CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'participant');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type tournament_type NOT NULL DEFAULT 'single_elimination',
    status tournament_status NOT NULL DEFAULT 'draft',
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_participants INTEGER CHECK (max_participants > 0),
    registration_deadline TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT tournaments_dates_check CHECK (
        (start_date IS NULL OR end_date IS NULL) OR (start_date <= end_date)
    ),
    CONSTRAINT tournaments_registration_deadline_check CHECK (
        registration_deadline IS NULL OR registration_deadline <= start_date
    )
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    captain_id UUID,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT teams_name_tournament_unique UNIQUE (name, tournament_id)
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
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

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER,
    match_number INTEGER,
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status match_status NOT NULL DEFAULT 'scheduled',
    venue TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT matches_different_teams_check CHECK (team1_id != team2_id),
    CONSTRAINT matches_round_number_check CHECK (round > 0),
    CONSTRAINT matches_match_number_check CHECK (match_number > 0),
    CONSTRAINT matches_times_check CHECK (
        (started_at IS NULL OR completed_at IS NULL) OR (started_at <= completed_at)
    )
);

-- Create match_results table
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team1_score INTEGER DEFAULT 0 CHECK (team1_score >= 0),
    team2_score INTEGER DEFAULT 0 CHECK (team2_score >= 0),
    details JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT match_results_match_unique UNIQUE (match_id)
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    type media_type NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    file_size INTEGER CHECK (file_size > 0),
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_tournaments table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS user_tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'participant',
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT user_tournaments_unique UNIQUE (user_id, tournament_id)
);

-- Create bracket_nodes table (for tournament brackets)
CREATE TABLE IF NOT EXISTS bracket_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL CHECK (round > 0),
    position INTEGER NOT NULL CHECK (position > 0),
    team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    parent_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT bracket_nodes_tournament_round_position_unique UNIQUE (tournament_id, round, position)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(type);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_team1_id ON matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_matches_team2_id ON matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_winner_id ON match_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_tournament_id ON media(tournament_id);
CREATE INDEX IF NOT EXISTS idx_media_team_id ON media(team_id);
CREATE INDEX IF NOT EXISTS idx_media_match_id ON media(match_id);
CREATE INDEX IF NOT EXISTS idx_user_tournaments_user_id ON user_tournaments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tournaments_tournament_id ON user_tournaments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_tournament_id ON bracket_nodes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_bracket_nodes_match_id ON bracket_nodes(match_id);

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
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_match_results_updated_at BEFORE UPDATE ON match_results FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bracket_nodes_updated_at BEFORE UPDATE ON bracket_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_nodes ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security policies
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tournaments: Anyone can view, authenticated users can create, creators can modify
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tournament creators can update their tournaments" ON tournaments FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Tournament creators can delete their tournaments" ON tournaments FOR DELETE USING (auth.uid() = creator_id);

-- Teams: Anyone can view, authenticated users can create, team members/organizers can modify
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Team captains and tournament creators can update teams" ON teams 
    FOR UPDATE USING (
        auth.uid() = captain_id OR 
        auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
    );
CREATE POLICY "Team captains and tournament creators can delete teams" ON teams 
    FOR DELETE USING (
        auth.uid() = captain_id OR 
        auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
    );

-- Players: Anyone can view, authenticated users can create, team captains/organizers can modify
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create players" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Team captains and tournament creators can update players" ON players 
    FOR UPDATE USING (
        auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id) OR
        auth.uid() IN (SELECT creator_id FROM tournaments t JOIN teams tm ON t.id = tm.tournament_id WHERE tm.id = team_id)
    );
CREATE POLICY "Team captains and tournament creators can delete players" ON players 
    FOR DELETE USING (
        auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id) OR
        auth.uid() IN (SELECT creator_id FROM tournaments t JOIN teams tm ON t.id = tm.tournament_id WHERE tm.id = team_id)
    );

-- Matches: Anyone can view, tournament organizers can manage
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage matches" ON matches FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
);

-- Match Results: Anyone can view, tournament organizers can manage
CREATE POLICY "Anyone can view match results" ON match_results FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage match results" ON match_results FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM tournaments t JOIN matches m ON t.id = m.tournament_id WHERE m.id = match_id)
);

-- Media: Anyone can view, authenticated users can upload, creators can manage
CREATE POLICY "Anyone can view media" ON media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload media" ON media FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can manage their own media" ON media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media" ON media FOR DELETE USING (auth.uid() = user_id);

-- User Tournaments: Users can view their own records, authenticated users can join
CREATE POLICY "Users can view their tournament participation" ON user_tournaments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join tournaments" ON user_tournaments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their tournament role" ON user_tournaments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave tournaments" ON user_tournaments FOR DELETE USING (auth.uid() = user_id);

-- Bracket Nodes: Anyone can view, tournament organizers can manage
CREATE POLICY "Anyone can view bracket nodes" ON bracket_nodes FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage bracket nodes" ON bracket_nodes FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
); 