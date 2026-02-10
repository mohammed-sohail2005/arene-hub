import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trophy, Users, Calendar, Clock, Youtube, CreditCard, Gamepad2, Target, UserPlus, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getTournament, registerTeam } from "@/services/api";

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [iglName, setIglName] = useState("");
  const [iglPlayerId, setIglPlayerId] = useState("");
  const [players, setPlayers] = useState([{ name: "", playerId: "" }, { name: "", playerId: "" }, { name: "", playerId: "" }]);

  const { data: tournament, isLoading, error } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => getTournament(id!),
    enabled: !!id,
  });

  const addPlayer = () => {
    if (players.length < 5) {
      setPlayers([...players, { name: "", playerId: "" }]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, field: "name" | "playerId", value: string) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleRegister = async () => {
    if (!teamName || !iglName || !iglPlayerId) {
      toast({ title: "Missing fields", description: "Please fill in team name, IGL name, and IGL player ID.", variant: "destructive" });
      return;
    }
    const validPlayers = players.filter(p => p.name && p.playerId);
    if (validPlayers.length === 0) {
      toast({ title: "No players", description: "Add at least one squad member.", variant: "destructive" });
      return;
    }
    try {
      await registerTeam({
        tournamentId: id!,
        teamName,
        iglName,
        iglPlayerId,
        players: validPlayers,
        paymentStatus: "pending",
        registeredAt: new Date().toISOString(),
      });
      toast({ title: "Registered!", description: `Team "${teamName}" has been registered. Complete payment to confirm.` });
      setRegisterOpen(false);
    } catch {
      toast({ title: "Error", description: "Registration failed. Make sure the backend is running.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h2 className="text-2xl font-display text-foreground mb-2">Tournament Not Found</h2>
          <p className="text-muted-foreground">Make sure your backend is running and the tournament exists.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const matchDate = new Date(tournament.matchDate);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            {tournament.profilePhoto && (
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                <AvatarImage src={tournament.profilePhoto} />
                <AvatarFallback>{tournament.ownerName[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-display text-xs">
                  {tournament.game.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="capitalize">{tournament.map}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {tournament.tournamentName}
              </h1>
              <p className="text-muted-foreground font-body">Hosted by {tournament.ownerName}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-gold" />
                <div className="font-display font-bold text-foreground">₹{tournament.prizePool}</div>
                <div className="text-xs text-muted-foreground">Prize Pool</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="font-display font-bold text-foreground">{format(matchDate, "MMM dd")}</div>
                <div className="text-xs text-muted-foreground">Match Date</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-neon-purple" />
                <div className="font-display font-bold text-foreground">{tournament.matchStartTime}</div>
                <div className="text-xs text-muted-foreground">Match Start</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="font-display font-bold text-foreground text-xs break-all">{tournament.upiId}</div>
                <div className="text-xs text-muted-foreground">UPI ID</div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20 bg-card/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Match Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Room Opens</span><span>{tournament.roomOpenTime}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Max Players</span><span>{tournament.maxPlayers}</span></div>
                {tournament.entryFee && <div className="flex justify-between"><span className="text-muted-foreground">Entry Fee</span><span>₹{tournament.entryFee}</span></div>}
                {tournament.killPoints && <div className="flex justify-between"><span className="text-muted-foreground">Kill Points</span><span>{tournament.killPoints}</span></div>}
                {tournament.rankPoints && <div className="flex justify-between"><span className="text-muted-foreground">Rank Points</span><span>{tournament.rankPoints}</span></div>}
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-card/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Additional Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {tournament.youtubeChannel && (
                  <a href={tournament.youtubeChannel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-destructive hover:underline">
                    <Youtube className="h-4 w-4" /> Watch on YouTube
                  </a>
                )}
                {tournament.description && <p className="text-muted-foreground">{tournament.description}</p>}
                {!tournament.description && !tournament.youtubeChannel && <p className="text-muted-foreground">No additional info provided.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Registered Teams */}
          <Card className="border-primary/20 bg-card/50 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" /> Registered Teams</span>
                <span className="text-xs text-muted-foreground">{tournament.registeredTeams?.length || 0} teams</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!tournament.registeredTeams || tournament.registeredTeams.length === 0) ? (
                <p className="text-muted-foreground text-sm text-center py-4">No teams registered yet. Be the first!</p>
              ) : (
                <div className="space-y-2">
                  {tournament.registeredTeams.map((team, i) => (
                    <div key={team._id || i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <span className="font-display font-bold text-foreground">{team.teamName}</span>
                        <span className="text-xs text-muted-foreground ml-2">IGL: {team.iglName}</span>
                      </div>
                      <Badge variant={team.paymentStatus === "paid" ? "default" : "outline"} className={team.paymentStatus === "paid" ? "bg-primary/20 text-primary" : ""}>
                        {team.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Register Button */}
          <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="w-full neon-glow font-display font-bold uppercase tracking-wider text-lg py-6">
                <UserPlus className="h-5 w-5 mr-2" /> Register Your Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Register Your Squad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Team Name *</label>
                  <Input placeholder="e.g., Shadow Wolves" value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">IGL Name *</label>
                    <Input placeholder="Leader name" value={iglName} onChange={e => setIglName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">IGL Player ID *</label>
                    <Input placeholder="In-game ID" value={iglPlayerId} onChange={e => setIglPlayerId(e.target.value)} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Squad Members</label>
                    {players.length < 5 && (
                      <Button type="button" variant="ghost" size="sm" onClick={addPlayer}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  {players.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input placeholder={`Player ${i + 1} name`} value={p.name} onChange={e => updatePlayer(i, "name", e.target.value)} />
                      <Input placeholder="Player ID" value={p.playerId} onChange={e => updatePlayer(i, "playerId", e.target.value)} />
                      {players.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePlayer(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <p className="text-muted-foreground">Pay via UPI: <span className="font-bold text-foreground">{tournament?.upiId || "N/A"}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Send payment to the UPI ID above and register your team.</p>
                </div>

                <Button className="w-full neon-glow font-display" onClick={handleRegister}>
                  Submit Registration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentDetail;
