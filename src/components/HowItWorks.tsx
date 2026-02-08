import { UserPlus, Gamepad2, Swords, Trophy } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register", desc: "Create your warrior profile and link your game ID" },
  { icon: Gamepad2, title: "Pick a Match", desc: "Browse tournaments and join your favourite game mode" },
  { icon: Swords, title: "Battle", desc: "Enter room codes and compete against the best players" },
  { icon: Trophy, title: "Win Prizes", desc: "Top the leaderboard and claim your rewards instantly" },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground md:text-4xl">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="mt-3 font-body text-lg text-muted-foreground">
            Four simple steps to glory
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 neon-glow">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-1 font-display text-xs font-bold tracking-widest text-muted-foreground">
                STEP {i + 1}
              </div>
              <h3 className="mb-2 font-display text-lg font-bold uppercase text-foreground">
                {title}
              </h3>
              <p className="font-body text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
