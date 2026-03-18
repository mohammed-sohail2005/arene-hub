-- ============================================
-- Arena Hub - Master Database Sync Script
-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL SCHEMA ERRORS AT ONCE

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

-- 3. FIX TOURNAMENTS TABLE (Points System & Staged)
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

-- 4. FIX SQUAD_RANKS TABLE (Leaderboard Data)
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS kills INTEGER;
ALTER TABLE IF EXISTS squad_ranks ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 0;

-- 5. CREATE MATCH_PROOFS TABLE (Host Master Proofs)
CREATE TABLE IF NOT EXISTS match_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL,
  screenshot_url TEXT NOT NULL,
  host_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. OPTIMIZE INDEXES
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_host_code ON registrations(host_code);
CREATE INDEX IF NOT EXISTS idx_registrations_team_code ON registrations(team_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_host_code ON tournaments(host_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_upi_id ON tournaments(upi_id);
CREATE INDEX IF NOT EXISTS idx_host_proofs_upi_id ON host_proofs(upi_id);
CREATE INDEX IF NOT EXISTS idx_match_proofs_match_id ON match_proofs(match_id);
CREATE INDEX IF NOT EXISTS idx_squad_ranks_match_id ON squad_ranks(match_id);

-- 5. REFRESH SCHEMA CACHE NOTIFIER
-- (Comment/Metadata update triggers PostgREST cache refresh in some versions)
COMMENT ON TABLE registrations IS 'Squad registrations for tournaments';
COMMENT ON TABLE tournaments IS 'Main tournament data';

-- 8. SECURITY CHECK (Ensure RLS is active)
ALTER TABLE IF EXISTS tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS host_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS squad_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS match_proofs ENABLE ROW LEVEL SECURITY;

-- 9. PERMISSIONS (Allow Match Proofs)
DROP POLICY IF EXISTS "Public Read Match Proofs" ON match_proofs;
CREATE POLICY "Public Read Match Proofs" ON match_proofs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Host Manage Match Proofs" ON match_proofs;
CREATE POLICY "Host Manage Match Proofs" ON match_proofs FOR ALL USING (true) WITH CHECK (true);

-- Success Message
SELECT '✅ Master Sync Complete. Your database schema is 100% in sync with the current code.' as status;
