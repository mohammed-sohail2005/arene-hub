-- ============================================
-- Arena Hub - Fix Missing Column
-- ============================================

-- Add slot_number to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS slot_number INTEGER;
