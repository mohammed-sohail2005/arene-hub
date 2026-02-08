import { Gamepad2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold tracking-wider">
              ARENA<span className="text-primary">X</span>
            </span>
          </div>
          <div className="flex gap-6">
            {["About", "Terms", "Privacy", "Contact"].map((item) => (
              <a key={item} href="#" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </div>
          <p className="font-body text-xs text-muted-foreground">
            © 2026 ArenaX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
