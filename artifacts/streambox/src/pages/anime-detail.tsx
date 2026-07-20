import { useRoute, Link } from "wouter";
import { useGetAnimeById, useGetAnimeEpisodes, useGetWatchlist, useAddToWatchlist, useRemoveFromWatchlist, getGetWatchlistQueryKey } from "@workspace/api-client-react";
import { Play, Star, Plus, Check, Clock, Calendar, Film, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AnimeDetail() {
  const [, params] = useRoute("/anime/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const queryClient = useQueryClient();
  const { data: anime, isLoading } = useGetAnimeById(id, { query: { enabled: !!id, queryKey: ['anime', id] } });
  
  const [epPage, setEpPage] = useState(1);
  const { data: epData, isLoading: loadingEps } = useGetAnimeEpisodes({ malId: id, page: epPage }, { query: { enabled: !!id, queryKey: ['anime', id, 'episodes', epPage] } });

  const { data: watchlist } = useGetWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const watchlistItem = watchlist?.find(item => item.contentId === id && item.contentType === 'anime');
  const inWatchlist = !!watchlistItem;

  const handleWatchlist = () => {
    if (inWatchlist && watchlistItem) {
      removeFromWatchlist.mutate({ itemId: watchlistItem.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWatchlistQueryKey() });
        }
      });
    } else if (anime) {
      addToWatchlist.mutate({ 
        data: { 
          contentId: id, 
          contentType: 'anime', 
          title: anime.title_english || anime.title,
          poster: anime.poster,
          score: anime.score
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
        <div className="container mx-auto px-4 -mt-32 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <div className="w-full aspect-[2/3] bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!anime) return <div className="p-20 text-center">Anime not found</div>;

  const displayTitle = anime.title_english || anime.title;

  return (
    <div className="min-h-screen pb-20">
      {/* Cinematic Header */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-background">
        {anime.poster && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 blur-xl scale-110"
            style={{ backgroundImage: `url(${anime.poster})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-32 md:-mt-64 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Poster Column */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start">
            <div className="w-64 md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 card-lift">
              {anime.poster ? (
                <img src={anime.poster} alt={displayTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
            
            <div className="w-64 md:w-full mt-6 space-y-3">
              <Link href={`/watch/anime?malId=${id}&ep=1`}>
                <Button size="lg" className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Play Episode 1
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full rounded-full bg-white/5 hover:bg-white/10 border-white/10 h-12"
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

          {/* Details Column */}
          <div className="md:col-span-9 flex flex-col mt-4 md:mt-20">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {anime.score && (
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 text-sm py-1 border-primary/20">
                  <Star className="w-4 h-4 mr-1 fill-primary" />
                  {anime.score} Score
                </Badge>
              )}
              {anime.status && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80 py-1">
                  {anime.status}
                </Badge>
              )}
              {anime.type && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80 py-1">
                  {anime.type}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-2 leading-tight">
              {displayTitle}
            </h1>
            {anime.title !== displayTitle && (
              <h2 className="text-lg md:text-xl text-muted-foreground font-medium mb-6">
                {anime.title}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              {anime.episodes && (
                <div className="flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  <span>{anime.episodes} Episodes</span>
                </div>
              )}
              {anime.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{anime.duration}</span>
                </div>
              )}
              {anime.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{anime.year}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {anime.genres?.map(genre => (
                <span key={genre} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/80 border border-white/5">
                  {genre}
                </span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-white/70">
                {anime.synopsis || "No synopsis available."}
              </p>
            </div>

            {anime.studios && anime.studios.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <span className="text-muted-foreground mr-2">Studio:</span>
                <span className="text-white">{anime.studios.join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-white">Episodes</h2>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            {loadingEps ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-16 bg-white/5" />)}
              </div>
            ) : !epData || epData.items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No episodes found for this anime.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {epData.items.map(ep => (
                  <Link 
                    key={ep.number} 
                    href={`/watch/anime?malId=${id}&ep=${ep.number}`}
                    className="flex flex-col sm:flex-row sm:items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-[100px]">
                      <span className="text-2xl font-display font-light text-white/40 group-hover:text-primary transition-colors">
                        {ep.number.toString().padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0 py-2 sm:py-0">
                      <h4 className="text-white font-medium truncate pr-4">
                        {ep.title || `Episode ${ep.number}`}
                      </h4>
                      {ep.aired && <p className="text-sm text-muted-foreground mt-1">{ep.aired.split('T')[0]}</p>}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto mt-2 sm:mt-0">
                      {ep.filler && (
                        <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20">
                          Filler
                        </Badge>
                      )}
                      <Button size="icon" variant="ghost" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary hover:bg-primary hover:text-white">
                        <PlayCircle className="w-6 h-6" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {epData?.hasNext && (
              <div className="p-4 bg-white/5 flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setEpPage(p => p + 1)}
                  className="hover:bg-white/10"
                >
                  Load Next Page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
