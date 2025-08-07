-- Add venue information columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS venue_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS venue_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS venue_hours TEXT,
ADD COLUMN IF NOT EXISTS venue_info TEXT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_tournaments_venue_location 
ON tournaments(venue_lat, venue_lng) 
WHERE venue_lat IS NOT NULL AND venue_lng IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tournaments.venue_address IS 'Full address of the venue';
COMMENT ON COLUMN tournaments.venue_lat IS 'Latitude coordinate of the venue';
COMMENT ON COLUMN tournaments.venue_lng IS 'Longitude coordinate of the venue';
COMMENT ON COLUMN tournaments.venue_phone IS 'Contact phone number for the venue';
COMMENT ON COLUMN tournaments.venue_hours IS 'Operating hours of the venue';
COMMENT ON COLUMN tournaments.venue_info IS 'Additional information about the venue (parking, facilities, etc.)';