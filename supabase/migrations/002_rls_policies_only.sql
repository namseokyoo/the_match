-- ===============================================
-- The Match: Row Level Security Policies Only
-- ===============================================
-- 이 파일은 RLS 정책이 제대로 적용되지 않았을 경우에만 실행하세요

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

-- ===============================================
-- PROFILES TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===============================================
-- TOURNAMENTS TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view tournaments" ON tournaments;
DROP POLICY IF EXISTS "Authenticated users can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Tournament creators can update their tournaments" ON tournaments;
DROP POLICY IF EXISTS "Tournament creators can delete their tournaments" ON tournaments;

CREATE POLICY "Anyone can view tournaments" ON tournaments 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tournaments" ON tournaments 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tournament creators can update their tournaments" ON tournaments 
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Tournament creators can delete their tournaments" ON tournaments 
    FOR DELETE USING (auth.uid() = creator_id);

-- ===============================================
-- TEAMS TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team captains and tournament creators can update teams" ON teams;
DROP POLICY IF EXISTS "Team captains and tournament creators can delete teams" ON teams;

CREATE POLICY "Anyone can view teams" ON teams 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams" ON teams 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

-- ===============================================
-- PLAYERS TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Authenticated users can create players" ON players;
DROP POLICY IF EXISTS "Team captains and tournament creators can update players" ON players;
DROP POLICY IF EXISTS "Team captains and tournament creators can delete players" ON players;

CREATE POLICY "Anyone can view players" ON players 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create players" ON players 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

-- ===============================================
-- MATCHES TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
DROP POLICY IF EXISTS "Tournament creators can manage matches" ON matches;

CREATE POLICY "Anyone can view matches" ON matches 
    FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage matches" ON matches 
    FOR ALL USING (
        auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
    );

-- ===============================================
-- MATCH RESULTS TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view match results" ON match_results;
DROP POLICY IF EXISTS "Tournament creators can manage match results" ON match_results;

CREATE POLICY "Anyone can view match results" ON match_results 
    FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage match results" ON match_results 
    FOR ALL USING (
        auth.uid() IN (SELECT creator_id FROM tournaments t JOIN matches m ON t.id = m.tournament_id WHERE m.id = match_id)
    );

-- ===============================================
-- MEDIA TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view media" ON media;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON media;
DROP POLICY IF EXISTS "Users can manage their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;

CREATE POLICY "Anyone can view media" ON media 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media" ON media 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can manage their own media" ON media 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media 
    FOR DELETE USING (auth.uid() = user_id);

-- ===============================================
-- USER TOURNAMENTS TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Users can view their tournament participation" ON user_tournaments;
DROP POLICY IF EXISTS "Users can join tournaments" ON user_tournaments;
DROP POLICY IF EXISTS "Users can update their tournament role" ON user_tournaments;
DROP POLICY IF EXISTS "Users can leave tournaments" ON user_tournaments;

CREATE POLICY "Users can view their tournament participation" ON user_tournaments 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join tournaments" ON user_tournaments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tournament role" ON user_tournaments 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave tournaments" ON user_tournaments 
    FOR DELETE USING (auth.uid() = user_id);

-- ===============================================
-- BRACKET NODES TABLE POLICIES
-- ===============================================
DROP POLICY IF EXISTS "Anyone can view bracket nodes" ON bracket_nodes;
DROP POLICY IF EXISTS "Tournament creators can manage bracket nodes" ON bracket_nodes;

CREATE POLICY "Anyone can view bracket nodes" ON bracket_nodes 
    FOR SELECT USING (true);

CREATE POLICY "Tournament creators can manage bracket nodes" ON bracket_nodes 
    FOR ALL USING (
        auth.uid() IN (SELECT creator_id FROM tournaments WHERE id = tournament_id)
    ); 