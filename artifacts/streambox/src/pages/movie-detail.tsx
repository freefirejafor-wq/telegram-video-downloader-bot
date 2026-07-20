import { useRoute, Link } from "wouter";
import { useGetMovieById, useGetWatchlist, useAddToWatchlist, useRemoveFromWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { Play, Star, Plus, Check, Clock, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

export function MovieDetail() {
  const [, params] = useRoute("/movies/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const queryClient = useQueryClient();
  const { data: movie, isLoading } = useGetMovieById(id, { query: { enabled: !!id, queryKey: ['movie', id] } });

  const { data: watchlist } = useGetWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const watchlistItem = watchlist?.find(item => item.contentId === id && item.contentType === 'movie');
  const inWatchlist = !!watchlistItem;

  const handleWatchlist = () => {
    if (inWatchlist && watchlistItem) {
      removeFromWatchlist.mutate({ itemId: watchlistItem.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        }
      });
    } else if (movie) {
      addToWatchlist.mutate({ 
        data: { 
          contentId: id, 
          contentType: 'movie', 
          title: movie.title,
          poster: movie.poster,
          score: movie.rating
        } 
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="w-full h-[60vh] bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!movie) return <div className="p-20 text-center">Movie not found</div>;

  const bgImage = movie.backdrop || movie.poster;

  return (
    <div className="min-h-screen pb-20">
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-background flex items-end">
        {bgImage && (
          <div className="absolute inset-0">
            <img 
              src={bgImage} 
              alt="" 
              className="w-full h-full object-cover object-top opacity-40 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10 pb-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="hidden md:block md:col-span-3">
            <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 card-lift">
              {movie.poster ? (
                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
          </div>

          <div className="md:col-span-9 flex flex-col md:pb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {movie.rating && (
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 text-sm py-1 border-primary/20">
                  <Star className="w-4 h-4 mr-1 fill-primary" />
                  {movie.rating.toFixed(1)} Rating
                </Badge>
              )}
              {movie.year && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80 py-1">
                  {movie.year}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-7xl font-display font-bold text-white mb-6 leading-tight text-glow">
              {movie.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {movie.genres?.map(genre => (
                <span key={genre} className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-white/90 backdrop-blur-md">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href={`/watch/movie?id=${id}`}>
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-base">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Watch Movie
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full bg-white/5 hover:bg-white/10 border-white/10 h-14 px-6"
                onClick={handleWatchlist}
                disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
              >
                {inWatchlist ? (
                  <><Check className="w-5 h-5 mr-2 text-green-500" /> In Watchlist</>
                ) : (
                  <><Plus className="w-5 h-5 mr-2" /> Add to Watchlist</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Overview</h2>
            <p className="text-lg leading-relaxed text-white/70 md:pr-12">
              {movie.overview || "No overview available."}
            </p>
          </div>

          <div className="md:col-span-4 space-y-8 glass-panel p-8 rounded-2xl">
            {movie.runtime && (
              <div>
                <div className="flex items-center text-muted-foreground mb-1">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium uppercase tracking-wider">Runtime</span>
                </div>
                <div className="text-white text-lg">{movie.runtime} minutes</div>
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div>
                <div className="flex items-center text-muted-foreground mb-3">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium uppercase tracking-wider">Top Cast</span>
                </div>
                <ul className="space-y-2">
                  {movie.cast.slice(0, 5).map(actor => (
                    <li key={actor} className="text-white">{actor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
