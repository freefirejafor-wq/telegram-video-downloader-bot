import { useLocation, useSearch } from "wouter";
import { useGetAnimeEmbed, useGetMovieEmbed } from "@workspace/api-client-react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WatchPlayer() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const isAnime = location.includes("/watch/anime");
  const isMovie = location.includes("/watch/movie");
  
  const malId = searchParams.get("malId") ? parseInt(searchParams.get("malId")!, 10) : null;
  const ep = searchParams.get("ep") ? parseInt(searchParams.get("ep")!, 10) : null;
  const movieId = searchParams.get("id") ? parseInt(searchParams.get("id")!, 10) : null;

  // Use refs or specific queries. For now, since hook options require params directly:
  const { data: animeEmbed, isLoading: loadingAnime, error: animeErr } = useGetAnimeEmbed(
    { malId: malId!, ep: ep || 1 },
    { query: { enabled: isAnime && !!malId, queryKey: ['embed-anime', malId, ep] } }
  );

  const { data: movieEmbed, isLoading: loadingMovie, error: movieErr } = useGetMovieEmbed(
    movieId!,
    { query: { enabled: isMovie && !!movieId, queryKey: ['embed-movie', movieId] } }
  );

  const isLoading = isAnime ? loadingAnime : loadingMovie;
  const embedUrl = isAnime ? animeEmbed?.embedUrl : movieEmbed?.embedUrl;
  const error = isAnime ? animeErr : movieErr;

  const handleBack = () => {
    if (isAnime && malId) setLocation(`/anime/${malId}`);
    else if (isMovie && movieId) setLocation(`/movies/${movieId}`);
    else setLocation("/");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="h-16 flex items-center px-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 transition-opacity duration-300 opacity-0 hover:opacity-100">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="text-white hover:bg-white/10 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Details
        </Button>
        <div className="ml-4 font-display font-semibold text-white/90">
          {isAnime ? `Episode ${ep || 1}` : "Movie"}
        </div>
      </div>

      <div className="flex-1 w-full bg-black relative flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center text-primary">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-white/50 animate-pulse">Initializing cinematic player...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-destructive max-w-md text-center">
            <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">Source Unavailable</h2>
            <p className="text-muted-foreground mb-6">We couldn't load the video source for this content. It might not be available or the stream is broken.</p>
            <Button onClick={handleBack} variant="outline" className="border-white/10 text-white">Go Back</Button>
          </div>
        ) : embedUrl ? (
          <iframe 
            src={embedUrl} 
            allowFullScreen 
            className="w-full h-full border-none"
            title="Video Player"
          />
        ) : (
          <div className="text-white">No video source found</div>
        )}
      </div>
      
      {isAnime && !isLoading && !error && embedUrl && (
        <div className="h-16 bg-black border-t border-white/5 flex items-center justify-between px-6">
          <div className="text-white/50 text-sm">
            Watching Episode {ep || 1}
          </div>
          <div className="flex gap-2">
            {ep && ep > 1 && (
               <Button 
                 variant="outline" 
                 size="sm"
                 className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                 onClick={() => setLocation(`/watch/anime?malId=${malId}&ep=${ep - 1}`)}
               >
                 Prev Ep
               </Button>
            )}
            <Button 
               variant="outline" 
               size="sm"
               className="bg-white/5 border-white/10 text-white hover:bg-white/10"
               onClick={() => setLocation(`/watch/anime?malId=${malId}&ep=${(ep || 1) + 1}`)}
             >
               Next Ep
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
