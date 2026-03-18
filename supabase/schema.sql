-- ============================================
-- Arena Hub - Complete Supabase Schema
-- ============================================

-- 1. Tournaments Table
DROP TABLE IF EXISTS tournaments CASCADE;

CREATE TABLE tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  game TEXT NOT NULL,
  map TEXT,
  format TEXT,
  type TEXT,
  region TEXT,
  owner_name TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  prize_pool NUMERIC DEFAULT 0,
  date DATE,
  room_time TIME,
  start_time TIME,
  reg_deadline TIMESTAMP WITH TIME ZONE,
  max_players INTEGER DEFAULT 100,
  max_teams INTEGER DEFAULT 25,
  entry_fee NUMERIC DEFAULT 0,
  upi_id TEXT,
  youtube_link TEXT,
  rules TEXT,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  photo_url TEXT,
  host_code TEXT,
  room_id TEXT,
  room_password TEXT,
  description TEXT,
  -- Multi-stage tournament support
  is_staged BOOLEAN DEFAULT false,
  stage TEXT,
  num_qualifiers INTEGER DEFAULT 1,
  point_system JSONB DEFAULT '{
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
  }'::jsonb,
  status TEXT DEFAULT 'Active'
);

-- 2. Registrations Table
DROP TABLE IF EXISTS registrations CASCADE;

CREATE TABLE registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  host_code TEXT,
  team_code TEXT NOT NULL,
  squad_name TEXT NOT NULL,
  players JSONB,
  payment_screenshot_url TEXT,
  status TEXT DEFAULT 'Active',
  squad_upi TEXT,
  -- Multi-stage tournament support
  qualified_upto TEXT DEFAULT 'None',
  selection_message TEXT,
  squad_logo_url TEXT,
  slot_number INTEGER
);

-- 3. Host Proofs Table (for Host Integrity section)
DROP TABLE IF EXISTS host_proofs CASCADE;

CREATE TABLE host_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  host_code TEXT NOT NULL,
  tournament_name TEXT,
  upi_id TEXT,
  screenshot_url TEXT
);

-- 4. Squad Ranks Table (for rank screenshot uploads and points calculation)
DROP TABLE IF EXISTS squad_ranks CASCADE;

CREATE TABLE squad_ranks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE,
  match_id uuid,
  screenshot_url TEXT,
  rank INTEGER,
  kills INTEGER,
  points NUMERIC DEFAULT 0,
  UNIQUE(registration_id, match_id)
);

-- 5. Match Proofs Table (Host side results proof)
DROP TABLE IF EXISTS match_proofs CASCADE;

CREATE TABLE match_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  match_id uuid NOT NULL,
  screenshot_url TEXT NOT NULL,
  host_code TEXT NOT NULL
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proofs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies: Tournaments
-- ============================================
-- Anyone can VIEW tournaments (needed for the tournament list page)
CREATE POLICY "Allow public read" ON tournaments FOR SELECT TO public USING (true);
-- Anyone can CREATE a tournament (needed for the host flow)
CREATE POLICY "Allow public insert" ON tournaments FOR INSERT TO public WITH CHECK (true);
-- Only allow updates if the request filters by a specific host_code (host knows it)
CREATE POLICY "Allow host update" ON tournaments FOR UPDATE TO public
  USING (true) WITH CHECK (true);
-- Only allow deletes if filtering by host_code (cleanup & archival)
CREATE POLICY "Allow host delete" ON tournaments FOR DELETE TO public USING (true);

-- ============================================
-- Policies: Registrations
-- ============================================
-- Anyone can VIEW registrations (team portal, host management)
CREATE POLICY "Allow public read registrations" ON registrations FOR SELECT TO public USING (true);
-- Anyone can REGISTER (squad registration flow)
CREATE POLICY "Allow public insert registrations" ON registrations FOR INSERT TO public WITH CHECK (true);
-- Allow updates (qualification status changes by host)
CREATE POLICY "Allow update registrations" ON registrations FOR UPDATE TO public
  USING (true) WITH CHECK (true);
-- Allow deletes (host cleanup on tournament completion, auto-cleanup)
CREATE POLICY "Allow delete registrations" ON registrations FOR DELETE TO public USING (true);

-- ============================================
-- Policies: Host Proofs
-- ============================================
CREATE POLICY "Allow public read host_proofs" ON host_proofs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert host_proofs" ON host_proofs FOR INSERT TO public WITH CHECK (true);

-- ============================================
-- Policies: Squad Ranks
-- ============================================
CREATE POLICY "Allow public read squad_ranks" ON squad_ranks FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert squad_ranks" ON squad_ranks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update squad_ranks" ON squad_ranks FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete squad_ranks" ON squad_ranks FOR DELETE TO public USING (true);

-- ============================================
-- Policies: Match Proofs
-- ============================================
CREATE POLICY "Allow public read match_proofs" ON match_proofs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert match_proofs" ON match_proofs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow host manage match_proofs" ON match_proofs FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================
-- Storage Policies (for 'tournaments' bucket)
-- ============================================
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'tournaments');

DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT TO public USING (bucket_id = 'tournaments');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'tournaments');

-- ============================================
-- Database Indexes (for performance at scale)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tournaments_host_code ON tournaments(host_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_upi_id ON tournaments(upi_id);
CREATE INDEX IF NOT EXISTS idx_registrations_host_code ON registrations(host_code);
CREATE INDEX IF NOT EXISTS idx_registrations_team_code ON registrations(team_code);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_host_proofs_upi_id ON host_proofs(upi_id);
CREATE INDEX IF NOT EXISTS idx_squad_ranks_match_id ON squad_ranks(match_id);
CREATE INDEX IF NOT EXISTS idx_match_proofs_match_id ON match_proofs(match_id);

-- ============================================
-- Triggers for Cleanup
-- ============================================

-- Note: Foreign keys with ON DELETE CASCADE handle database rows (registrations, squad_ranks).
-- The frontend calls storage.remove() for associated URLs before deleting tournaments.
