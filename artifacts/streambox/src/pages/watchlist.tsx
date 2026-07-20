import { useGetWatchlist } from "@workspace/api-client-react";
import { ContentCard } from "@/components/content-card";
import { Library, Film, Tv } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Watchlist() {
  const { data: watchlist, isLoading } = useGetWatchlist();

  return (
    <div className="container mx-auto px-4 py-12 min-h-[80vh]">
      <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-6">
        <Library className="w-8 h-8 text-primary" />
        <h1 className="font-display text-4xl font-bold text-white">My List</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !watchlist || watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Library className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Your list is empty</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Save shows and movies to keep track of what you want to watch.
          </p>
          <div className="flex gap-4">
            <Link href="/anime">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-white">
                <Tv className="w-4 h-4 mr-2" /> Explore Anime
              </Button>
            </Link>
            <Link href="/movies">
              <Button variant="outline" className="rounded-full bg-transparent border-white/20 hover:bg-white/10 text-white">
                <Film className="w-4 h-4 mr-2" /> Explore Movies
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {watchlist.map((item, index) => (
            <div 
              key={item.id}
              className="animate-in fade-in zoom-in slide-in-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ContentCard 
                id={item.contentId}
                type={item.contentType as "anime" | "movie"}
                title={item.title}
                poster={item.poster}
                score={item.score}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
