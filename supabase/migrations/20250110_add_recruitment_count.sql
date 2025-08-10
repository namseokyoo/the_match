-- Add recruitment_count and current_members columns to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS recruitment_count INTEGER DEFAULT NULL CHECK (recruitment_count IS NULL OR recruitment_count > 0),
ADD COLUMN IF NOT EXISTS current_members INTEGER DEFAULT 0 CHECK (current_members >= 0);

-- Add comment for clarity
COMMENT ON COLUMN teams.recruitment_count IS 'Number of players the team is recruiting';
COMMENT ON COLUMN teams.current_members IS 'Current number of members in the team';

-- Update current_members based on existing players
UPDATE teams t
SET current_members = COALESCE((
    SELECT COUNT(*)
    FROM players p
    WHERE p.team_id = t.id
), 0);