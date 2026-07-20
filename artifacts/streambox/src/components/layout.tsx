import { Link, useLocation } from "wouter";
import { Search, Clapperboard, Tv, Home, Library, Film } from "lucide-react";
import { Button } from "./ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/anime", label: "Anime", icon: Tv },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/watchlist", label: "My List", icon: Library },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
              <Clapperboard className="w-8 h-8" strokeWidth={2.5} />
              <span className="font-display font-bold text-2xl tracking-tight text-white text-glow">
                StreamBox
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    location === item.href
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-white hover:bg-white/10">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
      
      <footer className="py-12 border-t border-white/5 bg-black/50 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <Clapperboard className="w-5 h-5" />
            <span className="font-display font-semibold text-lg">StreamBox</span>
          </div>
          <p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
            Your cinematic hub for world cinema and anime. Built for immersion.
          </p>
        </div>
      </footer>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/90 backdrop-blur-md pb-safe">
        <nav className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg gap-1 min-w-[64px] ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
