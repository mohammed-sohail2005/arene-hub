import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { registerTeam, type Tournament } from "../services/api";

interface RegistrationDialogProps {
  tournamentId: string;
  tournament: Tournament;
}

const RegistrationDialog = ({ tournamentId, tournament }: RegistrationDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [iglName, setIglName] = useState("");
  const [iglPlayerId, setIglPlayerId] = useState("");
  const [players, setPlayers] = useState([
    { name: "", playerId: "" },
    { name: "", playerId: "" },
    { name: "", playerId: "" },
  ]);

  const updatePlayer = (index: number, field: "name" | "playerId", value: string) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleRegister = async () => {
    if (!teamName || !iglName || !iglPlayerId) {
      toast({ title: "Missing fields", description: "Please fill in squad name, IGL name, and IGL game ID.", variant: "destructive" });
      return;
    }

    const allPlayers = [
      { name: iglName, playerId: iglPlayerId },
      ...players,
    ];

    const emptyPlayer = allPlayers.find(p => !p.name || !p.playerId);
    if (emptyPlayer) {
      toast({ title: "Incomplete squad", description: "All 4 players must have a game name and game ID.", variant: "destructive" });
      return;
    }

    try {
      await registerTeam({
        tournamentId,
        teamName,
        iglName,
        iglPlayerId,
        players,
        paymentStatus: "pending",
        registeredAt: new Date().toISOString(),
      });
      toast({ title: "Registered!", description: `Squad "${teamName}" has been registered. Complete payment to confirm.` });
      setOpen(false);
      setTeamName("");
      setIglName("");
      setIglPlayerId("");
      setPlayers([{ name: "", playerId: "" }, { name: "", playerId: "" }, { name: "", playerId: "" }]);
    } catch {
      toast({ title: "Error", description: "Registration failed. Make sure the backend is running.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full neon-glow font-display font-bold uppercase tracking-wider text-lg py-6">
          <UserPlus className="h-5 w-5 mr-2" /> Register Your Squad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Register Your Squad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Squad Name */}
          <div>
            <label className="text-sm font-medium">Squad Name *</label>
            <Input placeholder="e.g., Shadow Wolves" value={teamName} onChange={e => setTeamName(e.target.value)} />
          </div>

          {/* IGL (Player 1) */}
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <label className="text-sm font-medium text-primary mb-2 block">Player 1 — IGL (In-Game Leader) *</label>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Game name" value={iglName} onChange={e => setIglName(e.target.value)} />
              <Input placeholder="Game ID" value={iglPlayerId} onChange={e => setIglPlayerId(e.target.value)} />
            </div>
          </div>

          {/* Players 2-4 */}
          {players.map((p, i) => (
            <div key={i}>
              <label className="text-sm font-medium mb-1 block">Player {i + 2} *</label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Game name" value={p.name} onChange={e => updatePlayer(i, "name", e.target.value)} />
                <Input placeholder="Game ID" value={p.playerId} onChange={e => updatePlayer(i, "playerId", e.target.value)} />
              </div>
            </div>
          ))}

          {/* Payment Info */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <p className="font-medium text-foreground mb-1">💳 Payment Required</p>
            <p className="text-muted-foreground">
              Pay the entry fee via UPI to: <span className="font-bold text-foreground">{tournament.upiId || "N/A"}</span>
            </p>
            {tournament.entryFee && (
              <p className="text-muted-foreground mt-1">
                Entry Fee: <span className="font-bold text-foreground">₹{tournament.entryFee}</span> per team
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Complete payment before registering. Your team will be verified by the host.</p>
          </div>

          <Button className="w-full neon-glow font-display" onClick={handleRegister}>
            Submit Registration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationDialog;
