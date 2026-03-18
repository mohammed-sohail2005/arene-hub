-- ============================================
-- Arena Hub - Automated Points System
-- ============================================

-- 1. Add Point System Configuration to Tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS point_system JSONB DEFAULT '{
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

-- 2. Add Scoring to Squad Ranks
ALTER TABLE squad_ranks ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE squad_ranks ADD COLUMN IF NOT EXISTS kills INTEGER;
ALTER TABLE squad_ranks ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 0;

-- 3. Index for leaderboard performance
CREATE INDEX IF NOT EXISTS idx_squad_ranks_match_id ON squad_ranks(match_id);
