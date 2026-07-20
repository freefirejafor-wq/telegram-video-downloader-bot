import { useState, useMemo } from "react";
import { useGetAnimeTop, useGetAnimeGenres } from "@workspace/api-client-react";
import { ContentCard } from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AnimeBrowse() {
  const [page, setPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  
  const { data: genresData } = useGetAnimeGenres();
  const { data, isLoading, isFetching } = useGetAnimeTop({ 
    page, 
    limit: 24,
    genre: selectedGenre 
  });

  // Accumulate items for continuous loading impression if we wanted to, 
  // but simpler to just paginate since Orval hook without infinite query doesn't accumulate nicely
  // Wait, let's keep it simple: just show current page for now, or build an accumulator.
  // Actually, we can use local state to accumulate if needed, but page-by-page is cleaner and less bug-prone with standard hooks.
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Explore Anime</h1>
          <p className="text-muted-foreground">Discover the best and highest rated anime series.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x" style={{ scrollbarWidth: 'none' }}>
          <Button 
            variant={selectedGenre ? "outline" : "default"}
            className="rounded-full snap-start whitespace-nowrap"
            onClick={() => { setSelectedGenre(undefined); setPage(1); }}
          >
            All Genres
          </Button>
          {genresData?.genres.slice(0, 15).map(g => (
            <Button
              key={g.id}
              variant={selectedGenre === g.name ? "default" : "outline"}
              className="rounded-full snap-start whitespace-nowrap bg-background"
              onClick={() => { setSelectedGenre(g.name); setPage(1); }}
            >
              {g.name}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {data?.items.map((item, index) => (
              <div 
                key={item.mal_id} 
                className="animate-in fade-in zoom-in slide-in-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ContentCard 
                  id={item.mal_id}
                  type="anime"
                  title={item.title_english || item.title}
                  poster={item.poster}
                  score={item.score}
                  episodes={item.episodes}
                  status={item.status}
                />
              </div>
            ))}
          </div>

          {data?.items.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No anime found for this genre.
            </div>
          )}

          {data && data.hasNext && (
            <div className="mt-12 flex justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8 bg-transparent border-white/20 hover:bg-white/10"
                onClick={() => setPage(p => p + 1)}
                disabled={isFetching}
              >
                {isFetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
