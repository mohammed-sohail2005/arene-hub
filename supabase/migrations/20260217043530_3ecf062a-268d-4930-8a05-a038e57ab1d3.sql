
-- Create game type enum
CREATE TYPE public.game_type AS ENUM ('bgmi', 'freefire');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid');

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game game_type NOT NULL,
  owner_name TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  map TEXT NOT NULL,
  prize_pool TEXT NOT NULL,
  match_date DATE NOT NULL,
  room_open_time TEXT NOT NULL,
  match_start_time TEXT NOT NULL,
  room_id TEXT,
  room_password TEXT,
  max_players TEXT NOT NULL,
  entry_fee TEXT,
  upi_id TEXT NOT NULL,
  register_amount TEXT,
  youtube_channel TEXT,
  kill_points TEXT,
  rank_points TEXT,
  description TEXT,
  profile_photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registered teams table
CREATE TABLE public.registered_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  igl_name TEXT NOT NULL,
  igl_player_id TEXT NOT NULL,
  players JSONB NOT NULL DEFAULT '[]',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_teams ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth)
CREATE POLICY "Anyone can read tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tournaments" ON public.tournaments FOR UPDATE USING (true);

CREATE POLICY "Anyone can read registrations" ON public.registered_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can register teams" ON public.registered_teams FOR INSERT WITH CHECK (true);
