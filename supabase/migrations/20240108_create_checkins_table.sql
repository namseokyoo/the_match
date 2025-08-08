-- Create checkins table for QR code check-in system
CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('match', 'team', 'player')),
    status VARCHAR(20) NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'absent')),
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ,
    qr_code_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique check-in per match/team/player combination
    UNIQUE(match_id, team_id, player_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_checkins_match_id ON public.checkins(match_id);
CREATE INDEX idx_checkins_team_id ON public.checkins(team_id);
CREATE INDEX idx_checkins_player_id ON public.checkins(player_id);
CREATE INDEX idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX idx_checkins_status ON public.checkins(status);
CREATE INDEX idx_checkins_checked_in_at ON public.checkins(checked_in_at);

-- Enable Row Level Security
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view check-ins for public matches
CREATE POLICY "Public can view match checkins" ON public.checkins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = checkins.match_id
            AND matches.status IN ('upcoming', 'in_progress', 'completed')
        )
    );

-- Match creators can manage all check-ins for their matches
CREATE POLICY "Match creators can manage checkins" ON public.checkins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = checkins.match_id
            AND matches.creator_id = auth.uid()
        )
    );

-- Users can create their own check-ins
CREATE POLICY "Users can create own checkins" ON public.checkins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users can update own checkins" ON public.checkins
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_checkins_updated_at
    BEFORE UPDATE ON public.checkins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_checkins_updated_at();

-- Create function to handle check-out
CREATE OR REPLACE FUNCTION public.handle_checkout(
    p_checkin_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE public.checkins
    SET 
        status = 'checked_out',
        checked_out_at = NOW()
    WHERE id = p_checkin_id
    AND status = 'checked_in';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get check-in statistics
CREATE OR REPLACE FUNCTION public.get_checkin_stats(
    p_match_id UUID
)
RETURNS TABLE(
    total_expected INTEGER,
    total_checked_in INTEGER,
    total_absent INTEGER,
    check_in_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id)::INTEGER as total_expected,
        COUNT(DISTINCT CASE WHEN c.status = 'checked_in' THEN c.player_id END)::INTEGER as total_checked_in,
        COUNT(DISTINCT CASE WHEN c.status = 'absent' OR c.id IS NULL THEN p.id END)::INTEGER as total_absent,
        CASE 
            WHEN COUNT(DISTINCT p.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN c.status = 'checked_in' THEN c.player_id END)::DECIMAL / COUNT(DISTINCT p.id)::DECIMAL * 100)
            ELSE 0
        END as check_in_rate
    FROM public.players p
    LEFT JOIN public.teams t ON p.team_id = t.id
    LEFT JOIN public.tournament_participants tp ON t.id = tp.team_id
    LEFT JOIN public.checkins c ON p.id = c.player_id AND c.match_id = p_match_id
    WHERE tp.tournament_id = p_match_id
    AND tp.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;