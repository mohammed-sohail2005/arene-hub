-- ============================================
-- Arena Hub - Database Schema Global Fix
-- ============================================
-- Run this in Supabase SQL Editor to fix all missing columns and sync the schema.

-- 1. FIX REGISTRATIONS TABLE
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS slot_number INTEGER;
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS squad_logo_url TEXT;
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS squad_upi TEXT;
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS qualified_upto TEXT DEFAULT 'None';
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS selection_message TEXT;
ALTER TABLE IF EXISTS registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 2. FIX HOST_PROOFS TABLE
ALTER TABLE IF EXISTS host_proofs ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE IF EXISTS host_proofs ADD COLUMN IF NOT EXISTS host_code TEXT;
ALTER TABLE IF EXISTS host_proofs ADD COLUMN IF NOT EXISTS tournament_name TEXT;

-- 3. FIX TOURNAMENTS TABLE
ALTER TABLE IF EXISTS tournaments ADD COLUMN IF NOT EXISTS is_staged BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS tournaments ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE IF EXISTS tournaments ADD COLUMN IF NOT EXISTS num_qualifiers INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE IF EXISTS tournaments ADD COLUMN IF NOT EXISTS point_system JSONB DEFAULT '{
  "kill": 1,
  "rank_1": 15,
  "rank_2": 12,
  "rank_3": 10,
  "rank_4": 8,
  "rank_5": 6,
  "rank_6": 4,
  "rank_7": 2,
  "rank_8": 1,
  "rank_9": 1,
  "rank_10": 1,
  "rank_11": 0,
  "rank_12": 0
}'::jsonb;

-- 4. FIX SQUAD_RANKS TABLE
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS kills INTEGER;
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 0;

-- 5. CREATE MATCH_PROOFS TABLE (If missing)
CREATE TABLE IF NOT EXISTS match_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  match_id uuid NOT NULL,
  screenshot_url TEXT NOT NULL,
  host_code TEXT NOT NULL
);

-- 6. SECURITY & POLICIES
ALTER TABLE IF EXISTS match_proofs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read match_proofs') THEN
        CREATE POLICY "Allow public read match_proofs" ON match_proofs FOR SELECT TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert match_proofs') THEN
        CREATE POLICY "Allow public insert match_proofs" ON match_proofs FOR INSERT TO public WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow host manage match_proofs') THEN
        CREATE POLICY "Allow host manage match_proofs" ON match_proofs FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tournaments_host_code ON tournaments(host_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_upi_id ON tournaments(upi_id);
CREATE INDEX IF NOT EXISTS idx_registrations_host_code ON registrations(host_code);
CREATE INDEX IF NOT EXISTS idx_registrations_team_code ON registrations(team_code);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_host_proofs_upi_id ON host_proofs(upi_id);
CREATE INDEX IF NOT EXISTS idx_squad_ranks_match_id ON squad_ranks(match_id);
CREATE INDEX IF NOT EXISTS idx_match_proofs_match_id ON match_proofs(match_id);

-- 8. REFRESH PostgREST Cache (Metadata update)
COMMENT ON TABLE registrations IS 'Squad registrations for tournaments';
COMMENT ON TABLE tournaments IS 'Main tournament data';

SELECT '✅ Schema Fix Applied Successfully' as result;
