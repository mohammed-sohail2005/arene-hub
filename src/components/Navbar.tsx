import { Gamepad2, Menu, X, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold tracking-wider text-foreground">
            ARENA<span className="text-primary">X</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {["Tournaments", "Games", "Leaderboard", "How It Works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-body text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" className="font-body font-semibold uppercase tracking-wider" asChild>
            <Link to="/host">
              <Plus className="h-4 w-4 mr-1" />
              Host Match
            </Link>
          </Button>
          <Button variant="ghost" className="font-body font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary">
            Login
          </Button>
          <Button className="font-body font-bold uppercase tracking-wider neon-glow">
            Register
          </Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 p-4">
            {["Tournaments", "Games", "Leaderboard", "How It Works"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="font-body text-sm font-semibold uppercase tracking-wider text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </a>
            ))}
            <Button variant="outline" className="w-full font-body font-semibold uppercase" asChild>
              <Link to="/host" onClick={() => setMobileOpen(false)}>
                <Plus className="h-4 w-4 mr-1" />
                Host Match
              </Link>
            </Button>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 font-body font-semibold uppercase">Login</Button>
              <Button className="flex-1 font-body font-bold uppercase neon-glow">Register</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
