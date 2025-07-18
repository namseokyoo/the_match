-- ===============================================
-- The Match: Complete RLS Policies
-- 새로 생성된 테이블들에 대한 RLS 정책
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_nodes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create matches" ON matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Match creators can update their matches" ON matches FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Match creators can delete their matches" ON matches FOR DELETE USING (auth.uid() = creator_id);

-- Teams policies
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Team captains and match creators can update teams" ON teams 
    FOR UPDATE USING (
        auth.uid() = captain_id OR 
        auth.uid() IN (SELECT creator_id FROM matches WHERE id = match_id)
    );
CREATE POLICY "Team captains and match creators can delete teams" ON teams 
    FOR DELETE USING (
        auth.uid() = captain_id OR 
        auth.uid() IN (SELECT creator_id FROM matches WHERE id = match_id)
    );

-- Players policies
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create players" ON players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Team captains and match creators can update players" ON players 
    FOR UPDATE USING (
        auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id) OR
        auth.uid() IN (SELECT creator_id FROM matches m JOIN teams t ON m.id = t.match_id WHERE t.id = team_id)
    );
CREATE POLICY "Team captains and match creators can delete players" ON players 
    FOR DELETE USING (
        auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id) OR
        auth.uid() IN (SELECT creator_id FROM matches m JOIN teams t ON m.id = t.match_id WHERE t.id = team_id)
    );

-- Match participants policies
CREATE POLICY "Anyone can view match participants" ON match_participants FOR SELECT USING (true);
CREATE POLICY "Team captains can apply to matches" ON match_participants FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
);
CREATE POLICY "Team captains can update their applications" ON match_participants FOR UPDATE USING (
    auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
);
CREATE POLICY "Match creators can manage all participants" ON match_participants FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM matches WHERE id = match_id)
);
CREATE POLICY "Team captains can withdraw their applications" ON match_participants FOR DELETE USING (
    auth.uid() IN (SELECT captain_id FROM teams WHERE id = team_id)
);

-- Games policies
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Match creators can manage games" ON games FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM matches WHERE id = match_id)
);

-- Game results policies
CREATE POLICY "Anyone can view game results" ON game_results FOR SELECT USING (true);
CREATE POLICY "Match creators can manage game results" ON game_results FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM matches m JOIN games g ON m.id = g.match_id WHERE g.id = game_id)
);

-- Media policies
CREATE POLICY "Anyone can view media" ON media FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload media" ON media FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can manage their own media" ON media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own media" ON media FOR DELETE USING (auth.uid() = user_id);

-- User matches policies
CREATE POLICY "Users can view their match participation" ON user_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join matches" ON user_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their match role" ON user_matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave matches" ON user_matches FOR DELETE USING (auth.uid() = user_id);

-- Bracket nodes policies
CREATE POLICY "Anyone can view bracket nodes" ON bracket_nodes FOR SELECT USING (true);
CREATE POLICY "Match creators can manage bracket nodes" ON bracket_nodes FOR ALL USING (
    auth.uid() IN (SELECT creator_id FROM matches WHERE id = match_id)
);