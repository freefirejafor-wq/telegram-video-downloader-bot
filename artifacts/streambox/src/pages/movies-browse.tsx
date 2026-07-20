import { useState } from "react";
import { useGetMoviesTop, useGetMovieGenres } from "@workspace/api-client-react";
import { ContentCard } from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function MoviesBrowse() {
  const [page, setPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  
  const { data: genresData } = useGetMovieGenres();
  const { data, isLoading, isFetching } = useGetMoviesTop({ 
    page, 
    genre: selectedGenre 
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Explore Movies</h1>
          <p className="text-muted-foreground">Discover cinematic masterpieces and blockbusters.</p>
        </div>
        
        {genresData?.genres && genresData.genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x" style={{ scrollbarWidth: 'none' }}>
            <Button 
              variant={selectedGenre ? "outline" : "default"}
              className="rounded-full snap-start whitespace-nowrap"
              onClick={() => { setSelectedGenre(undefined); setPage(1); }}
            >
              All Genres
            </Button>
            {genresData.genres.map(g => (
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
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <span className="text-3xl">🎬</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Movies Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            The movies database is currently being populated or requires API key configuration. Please check back later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {data.items.map((item, index) => (
              <div 
                key={item.tmdb_id} 
                className="animate-in fade-in zoom-in slide-in-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ContentCard 
                  id={item.tmdb_id}
                  type="movie"
                  title={item.title}
                  poster={item.poster}
                  score={item.rating}
                  year={item.year}
                />
              </div>
            ))}
          </div>

          {data.hasNext && (
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
