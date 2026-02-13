import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trophy, Users, Calendar, Clock, Youtube, CreditCard, Gamepad2, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getTournament } from "../services/api";
import RegistrationDialog from "../components/RegistrationDialog";

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: tournament, isLoading, error } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => getTournament(id!),
    enabled: !!id,
  });

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
          <RegistrationDialog tournamentId={id!} tournament={tournament} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TournamentDetail;
