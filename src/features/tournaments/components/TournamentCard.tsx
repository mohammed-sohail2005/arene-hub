import { Calendar, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TournamentCardProps {
  game: string;
  title: string;
  prize: string;
  players: string;
  date: string;
  status: "live" | "upcoming" | "registration";
  slots: string;
}

const statusStyles: Record<string, string> = {
  live: "bg-destructive/20 text-destructive border-destructive/30 animate-pulse-neon",
  upcoming: "bg-accent/20 text-accent border-accent/30",
  registration: "bg-primary/20 text-primary border-primary/30",
};

const statusLabels: Record<string, string> = {
  live: "🔴 LIVE",
  upcoming: "UPCOMING",
  registration: "OPEN",
};

const TournamentCard = ({ game, title, prize, players, date, status, slots }: TournamentCardProps) => {
  return (
    <div className="group card-hover cursor-pointer rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-body text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {game}
          </span>
          <Badge variant="outline" className={`font-display text-[10px] font-bold tracking-wider ${statusStyles[status]}`}>
            {statusLabels[status]}
          </Badge>
        </div>

        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground mb-4 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md bg-secondary/50 p-2.5 text-center">
            <Trophy className="mx-auto mb-1 h-4 w-4 text-gold" />
            <div className="font-display text-sm font-bold text-foreground">{prize}</div>
            <div className="font-body text-[10px] uppercase text-muted-foreground">Prize</div>
          </div>
          <div className="rounded-md bg-secondary/50 p-2.5 text-center">
            <Users className="mx-auto mb-1 h-4 w-4 text-primary" />
            <div className="font-display text-sm font-bold text-foreground">{players}</div>
            <div className="font-body text-[10px] uppercase text-muted-foreground">Players</div>
          </div>
          <div className="rounded-md bg-secondary/50 p-2.5 text-center">
            <Calendar className="mx-auto mb-1 h-4 w-4 text-neon-purple" />
            <div className="font-display text-sm font-bold text-foreground">{date}</div>
            <div className="font-body text-[10px] uppercase text-muted-foreground">Date</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-body text-xs text-muted-foreground">{slots} slots left</span>
          <span className="font-body text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
