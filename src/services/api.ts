// Configure your backend API URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface Tournament {
  _id?: string;
  game: "bgmi" | "freefire";
  ownerName: string;
  tournamentName: string;
  map: string;
  prizePool: string;
  matchDate: string;
  roomOpenTime: string;
  matchStartTime: string;
  roomId?: string;
  roomPassword?: string;
  maxPlayers: string;
  entryFee?: string;
  upiId: string;
  registerAmount?: string;
  youtubeChannel?: string;
  killPoints?: string;
  rankPoints?: string;
  description?: string;
  profilePhoto?: string | null;
  createdAt: string;
  registeredTeams?: RegisteredTeam[];
}

export interface RegisteredTeam {
  _id?: string;
  tournamentId: string;
  teamName: string;
  iglName: string;
  iglPlayerId: string;
  players: { name: string; playerId: string }[];
  paymentStatus: "pending" | "paid";
  registeredAt: string;
}

// Tournament APIs
export const createTournament = async (data: Omit<Tournament, "_id" | "registeredTeams">): Promise<Tournament> => {
  const res = await fetch(`${API_BASE_URL}/tournaments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create tournament");
  return res.json();
};

export const getTournaments = async (): Promise<Tournament[]> => {
  const res = await fetch(`${API_BASE_URL}/tournaments`);
  if (!res.ok) throw new Error("Failed to fetch tournaments");
  return res.json();
};

export const getTournament = async (id: string): Promise<Tournament> => {
  const res = await fetch(`${API_BASE_URL}/tournaments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch tournament");
  return res.json();
};

// Team Registration APIs
export const registerTeam = async (data: Omit<RegisteredTeam, "_id">): Promise<RegisteredTeam> => {
  const res = await fetch(`${API_BASE_URL}/tournaments/${data.tournamentId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to register team");
  return res.json();
};
