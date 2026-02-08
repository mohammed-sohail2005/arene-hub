const games = [
  { name: "BGMI", tournaments: 45, players: "12K", color: "from-primary/20 to-primary/5" },
  { name: "Free Fire", tournaments: 38, players: "10K", color: "from-accent/20 to-accent/5" },
  { name: "COD Mobile", tournaments: 22, players: "6K", color: "from-gold/20 to-gold/5" },
  { name: "Valorant Mobile", tournaments: 15, players: "4K", color: "from-neon-purple/20 to-neon-purple/5" },
];

const GamesSection = () => {
  return (
    <section id="games" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground md:text-4xl">
            Supported <span className="text-primary">Games</span>
          </h2>
          <p className="mt-3 font-body text-lg text-muted-foreground">
            More games added every month
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((g) => (
            <div
              key={g.name}
              className={`card-hover cursor-pointer rounded-lg border border-border/50 bg-gradient-to-br ${g.color} p-6 text-center backdrop-blur-sm`}
            >
              <div className="mb-2 font-display text-2xl font-black uppercase tracking-wider text-foreground">
                {g.name}
              </div>
              <div className="font-body text-sm text-muted-foreground">
                {g.tournaments} Tournaments • {g.players} Players
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
