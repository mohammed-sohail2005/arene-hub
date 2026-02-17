import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trophy, Users, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { getTournaments } from "../services/api";

const Tournaments = () => {
  const { data: tournaments, isLoading, error } = useQuery({
    queryKey: ["tournaments"],
    queryFn: getTournaments,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Join <span className="text-primary neon-glow">Tournaments</span>
          </h1>
          <p className="text-muted-foreground font-body">Browse and join active tournaments</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Unable to load tournaments. Please try again later.</p>
          </div>
        )}

        {tournaments && tournaments.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No tournaments yet. Be the first to host one!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.map((t) => (
            <Link key={t.id} to={`/tournament/${t.id}`} className="group">
              <div className="card-hover rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-body text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t.game.toUpperCase()}
                  </span>
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-display text-[10px] capitalize">
                    {t.map}
                  </Badge>
                </div>

                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground mb-4 group-hover:text-primary transition-colors">
                  {t.tournament_name}
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-md bg-secondary/50 p-2.5 text-center">
                    <Trophy className="mx-auto mb-1 h-4 w-4 text-gold" />
                    <div className="font-display text-sm font-bold text-foreground">₹{t.prize_pool}</div>
                    <div className="font-body text-[10px] uppercase text-muted-foreground">Prize</div>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2.5 text-center">
                    <Calendar className="mx-auto mb-1 h-4 w-4 text-neon-purple" />
                    <div className="font-display text-sm font-bold text-foreground">{format(new Date(t.match_date), "MMM dd")}</div>
                    <div className="font-body text-[10px] uppercase text-muted-foreground">Date</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> {t.entry_fee ? `₹${t.entry_fee}` : "Free"}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {t.registered_teams?.length || 0} teams
                  </span>
                </div>

                <div className="mt-3 text-right">
                  <span className="font-body text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">
                    View & Register →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tournaments;
