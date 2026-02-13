import TournamentCard from "./TournamentCard";

const tournaments = [
  { game: "BGMI", title: "Battlegrounds Pro League S4", prize: "₹5L", players: "128", date: "Feb 15", status: "live" as const, slots: "4" },
  { game: "Free Fire", title: "Fire Max Championship", prize: "₹3L", players: "96", date: "Feb 18", status: "registration" as const, slots: "22" },
  { game: "BGMI", title: "Squad Showdown Weekly", prize: "₹50K", players: "64", date: "Feb 20", status: "registration" as const, slots: "16" },
  { game: "Free Fire", title: "Clash Royale Cup", prize: "₹1L", players: "48", date: "Feb 22", status: "upcoming" as const, slots: "48" },
  { game: "BGMI", title: "Solo Sniper Challenge", prize: "₹25K", players: "100", date: "Feb 25", status: "upcoming" as const, slots: "67" },
  { game: "Free Fire", title: "Duo Arena Masters", prize: "₹75K", players: "80", date: "Feb 28", status: "upcoming" as const, slots: "80" },
];

const TournamentsSection = () => {
  return (
    <section id="tournaments" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground md:text-4xl">
            Featured <span className="text-primary">Tournaments</span>
          </h2>
          <p className="mt-3 font-body text-lg text-muted-foreground">
            Pick your battle. Register now before slots fill up.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.title} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;
