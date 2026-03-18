-- ============================================
-- Arena Hub - Security Hardening Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add missing DELETE policies for tournaments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow host delete' AND tablename = 'tournaments') THEN
    CREATE POLICY "Allow host delete" ON tournaments FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created: tournaments DELETE policy';
  ELSE
    RAISE NOTICE 'Already exists: tournaments DELETE policy';
  END IF;
END $$;

-- 2. Add missing DELETE policies for registrations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete registrations' AND tablename = 'registrations') THEN
    CREATE POLICY "Allow delete registrations" ON registrations FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created: registrations DELETE policy';
  ELSE
    RAISE NOTICE 'Already exists: registrations DELETE policy';
  END IF;
END $$;

-- 3. Add missing DELETE policies for squad_ranks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete squad_ranks' AND tablename = 'squad_ranks') THEN
    CREATE POLICY "Allow delete squad_ranks" ON squad_ranks FOR DELETE TO public USING (true);
    RAISE NOTICE 'Created: squad_ranks DELETE policy';
  ELSE
    RAISE NOTICE 'Already exists: squad_ranks DELETE policy';
  END IF;
END $$;

-- 4. Add Storage DELETE policy (needed for screenshot cleanup)
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'tournaments');

-- 5. Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_host_code ON tournaments(host_code);
CREATE INDEX IF NOT EXISTS idx_registrations_host_code ON registrations(host_code);
CREATE INDEX IF NOT EXISTS idx_registrations_team_code ON registrations(team_code);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_id ON registrations(tournament_id);

-- Done!
-- This migration adds:
-- ✅ DELETE policies so hosts can properly archive/complete tournaments
-- ✅ Storage DELETE policy so hosts can clean up payment screenshots
-- ✅ Performance indexes on host_code, team_code, tournament_id for faster queries
