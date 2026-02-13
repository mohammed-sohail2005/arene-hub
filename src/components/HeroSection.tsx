import { Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />

      <div className="container relative z-10 mx-auto px-4 pt-20 text-center">
        <div className="animate-slide-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold uppercase tracking-wider text-primary">
              Season 4 Live Now
            </span>
          </div>

          <h1 className="mb-6 font-display text-4xl font-black uppercase leading-tight tracking-wider md:text-6xl lg:text-7xl">
            Dominate The
            <br />
            <span className="neon-text text-primary">Battleground</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl font-body text-lg font-medium text-muted-foreground md:text-xl">
            Host & compete in BGMI, Free Fire, and more. Join thousands of warriors
            battling for glory and massive prize pools.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/tournaments">
              <Button size="lg" className="px-8 py-6 font-display text-sm font-bold uppercase tracking-widest neon-glow">
                Join Tournament
              </Button>
            </Link>
            <Link to="/host">
              <Button
                size="lg"
                variant="outline"
                className="border-muted-foreground/30 px-8 py-6 font-display text-sm font-bold uppercase tracking-widest text-foreground hover:border-primary hover:text-primary"
              >
                Host a Match
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Trophy, label: "Prize Pool", value: "₹50L+" },
            { icon: Users, label: "Active Players", value: "25K+" },
            { icon: Zap, label: "Daily Matches", value: "100+" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
            >
              <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-display text-2xl font-bold text-foreground">{value}</div>
              <div className="font-body text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
