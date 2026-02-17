import { supabase } from "@/integrations/supabase/client";

export interface Player {
  name: string;
  playerId: string;
}

export interface Tournament {
  id: string;
  game: "bgmi" | "freefire";
  owner_name: string;
  tournament_name: string;
  map: string;
  prize_pool: string;
  match_date: string;
  room_open_time: string;
  match_start_time: string;
  room_id?: string | null;
  room_password?: string | null;
  max_players: string;
  entry_fee?: string | null;
  upi_id: string;
  register_amount?: string | null;
  youtube_channel?: string | null;
  kill_points?: string | null;
  rank_points?: string | null;
  description?: string | null;
  profile_photo?: string | null;
  created_at: string;
  registered_teams?: RegisteredTeam[];
}

export interface RegisteredTeam {
  id: string;
  tournament_id: string;
  team_name: string;
  igl_name: string;
  igl_player_id: string;
  players: Player[];
  payment_status: "pending" | "paid";
  registered_at: string;
}

// Tournament APIs
export const createTournament = async (data: Omit<Tournament, "id" | "registered_teams" | "created_at">): Promise<Tournament> => {
  const { data: result, error } = await supabase
    .from("tournaments")
    .insert(data as any)
    .select()
    .single();
  if (error) throw error;
  return result as unknown as Tournament;
};

export const getTournaments = async (): Promise<Tournament[]> => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*, registered_teams(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Tournament[];
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*, registered_teams(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as Tournament;
};

// Team Registration
export const registerTeam = async (data: Omit<RegisteredTeam, "id" | "registered_at">): Promise<RegisteredTeam> => {
  const { data: result, error } = await supabase
    .from("registered_teams")
    .insert({
      tournament_id: data.tournament_id,
      team_name: data.team_name,
      igl_name: data.igl_name,
      igl_player_id: data.igl_player_id,
      players: data.players as any,
      payment_status: data.payment_status,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return result as unknown as RegisteredTeam;
};
