-- ============================================
-- Arena Hub - Host Integrity (UPI Focus)
-- ============================================

-- 1. Add upi_id to host_proofs
ALTER TABLE host_proofs ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- 2. Optional: Populate upi_id for existing proofs based on host_code
-- (This assumes host_code identifies the tournament which has the upi_id)
-- But since host_proofs is a summary table, we'll leave existing rows as NULL or 'Existing'
UPDATE host_proofs SET upi_id = 'Legacy Host' WHERE upi_id IS NULL;

-- 3. Add Index for UPI ID lookup (to speed up "arrange" and filter)
CREATE INDEX IF NOT EXISTS idx_host_proofs_upi_id ON host_proofs(upi_id);
