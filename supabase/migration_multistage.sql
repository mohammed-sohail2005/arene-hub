-- ============================================
-- Arena Hub - Migration: Add Multi-Stage Tournament Support
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================

-- Add multi-stage columns to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_staged BOOLEAN DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS num_qualifiers INTEGER DEFAULT 1;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Add multi-stage columns to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS qualified_upto TEXT DEFAULT 'None';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS squad_logo_url TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS slot_number INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS selection_message TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Allow deleting registrations (needed for team removal and cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete registrations' AND tablename = 'registrations'
  ) THEN
    CREATE POLICY "Allow public delete registrations" ON registrations FOR DELETE TO public USING (true);
  END IF;
END
$$;

-- Allow deleting tournaments (needed for auto-cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete tournaments' AND tablename = 'tournaments'
  ) THEN
    CREATE POLICY "Allow public delete tournaments" ON tournaments FOR DELETE TO public USING (true);
  END IF;
END
$$;

-- Allow deleting squad_ranks (needed for cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete squad_ranks' AND tablename = 'squad_ranks'
  ) THEN
    CREATE POLICY "Allow public delete squad_ranks" ON squad_ranks FOR DELETE TO public USING (true);
  END IF;
END
$$;

-- Allow deleting storage objects (needed for cleanup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'tournaments');
  END IF;
END
$$;
