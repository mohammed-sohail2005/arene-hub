-- RUN THIS IN SUPABASE SQL EDITOR TO FIX DISQUALIFICATION ERROR
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS selection_message TEXT;

-- Refresh the schema cache
COMMENT ON TABLE registrations IS 'Squad registrations for tournaments';
