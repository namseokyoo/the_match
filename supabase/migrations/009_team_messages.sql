-- Create team_messages table for team chat functionality
CREATE TABLE IF NOT EXISTS team_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Ensure message has content
    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- Add indexes for performance
CREATE INDEX idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX idx_team_messages_user_id ON team_messages(user_id);
CREATE INDEX idx_team_messages_created_at ON team_messages(created_at DESC);
CREATE INDEX idx_team_messages_pinned ON team_messages(is_pinned) WHERE is_pinned = true;

-- RLS (Row Level Security) policies
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read messages from teams
-- (In production, you'd want to restrict this to team members only)
CREATE POLICY "Users can read team messages" ON team_messages
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Users can send messages" ON team_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own messages (for pinning)
CREATE POLICY "Users can update own messages" ON team_messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON team_messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow team captains to manage all messages in their team
CREATE POLICY "Team captains can manage team messages" ON team_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_messages.team_id
            AND teams.captain_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams
            WHERE teams.id = team_messages.team_id
            AND teams.captain_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_team_messages_updated_at BEFORE UPDATE ON team_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();