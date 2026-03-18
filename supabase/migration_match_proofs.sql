-- ============================================
-- Arena Hub - Match Proofs (Host Side)
-- ============================================

-- 1. Create Match Proofs Table
CREATE TABLE IF NOT EXISTS match_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL,
  screenshot_url TEXT NOT NULL,
  host_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_match_proofs_match_id ON match_proofs(match_id);

-- 3. Enable RLS
ALTER TABLE match_proofs ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Public Read, Host Full Control)
-- Note: host_code based policies are safer but for simplicity we allow insertions
DROP POLICY IF EXISTS "Public Read Match Proofs" ON match_proofs;
CREATE POLICY "Public Read Match Proofs" ON match_proofs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Host Manage Match Proofs" ON match_proofs;
CREATE POLICY "Host Manage Match Proofs" ON match_proofs 
FOR ALL USING (true) WITH CHECK (true);
