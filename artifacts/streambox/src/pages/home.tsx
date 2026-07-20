import { useGetAnimeTrending, useGetMoviesTrending, useGetAnimeTop, useGetMoviesTop } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { HorizontalScrollRow } from "@/components/horizontal-scroll-row";

export function Home() {
  const { data: trendingAnime, isLoading: loadingAnime } = useGetAnimeTrending({ limit: 10 });
  const { data: trendingMovies, isLoading: loadingMovies } = useGetMoviesTrending({});
  const { data: topAnime } = useGetAnimeTop({ limit: 10 });
  const { data: topMovies } = useGetMoviesTop({});

  const heroItem = trendingAnime?.items[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden">
        {heroItem && heroItem.poster ? (
          <>
            <div className="absolute inset-0">
              {/* Blur backdrop for hero */}
              <div 
                className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30"
                style={{ backgroundImage: `url(${heroItem.poster})` }}
              />
              <img 
                src={heroItem.poster} 
                alt={heroItem.title} 
                className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-20">
              <div className="flex flex-col gap-6 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30">
                    #1 Trending
                  </span>
                  <span className="text-white/70 text-sm font-medium">{heroItem.type} • {heroItem.year}</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-[1.1] tracking-tight text-glow">
                  {heroItem.title_english || heroItem.title}
                </h1>
                
                {heroItem.synopsis && (
                  <p className="text-lg text-white/70 line-clamp-3 md:line-clamp-4 leading-relaxed">
                    {heroItem.synopsis}
                  </p>
                )}
                
                <div className="flex items-center gap-4 pt-4">
                  <Link href={`/anime/${heroItem.mal_id}`}>
                    <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 h-14 px-8 text-base font-bold">
                      <Info className="w-5 h-5 mr-2" />
                      More Info
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-end items-center relative perspective-1000">
                <div className="w-[300px] aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out z-20">
                   <img src={heroItem.poster} alt={heroItem.title} className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-[300px] aspect-[2/3] rounded-2xl bg-primary/20 blur-3xl z-10 translate-x-10 translate-y-10" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
      </section>

      {/* Content Rows */}
      <div className="flex flex-col gap-4 -mt-20 z-20 relative pb-20">
        <HorizontalScrollRow title="Trending Anime">
          {loadingAnime ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-none w-[160px] md:w-[220px] aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : (
            trendingAnime?.items.slice(1).map(item => (
              <div key={`ta-${item.mal_id}`} className="flex-none w-[160px] md:w-[220px] snap-start">
                <ContentCard 
                  id={item.mal_id} 
                  type="anime" 
                  title={item.title_english || item.title} 
                  poster={item.poster} 
                  score={item.score}
                  episodes={item.episodes}
                  year={item.year}
                  status={item.status}
                />
              </div>
            ))
          )}
        </HorizontalScrollRow>

        <HorizontalScrollRow title="Trending Movies">
          {loadingMovies ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-none w-[160px] md:w-[220px] aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : trendingMovies?.items.length === 0 ? (
            <div className="w-full text-center py-10 px-4">
              <p className="text-muted-foreground">Movies coming soon</p>
            </div>
          ) : (
            trendingMovies?.items.map(item => (
              <div key={`tm-${item.tmdb_id}`} className="flex-none w-[160px] md:w-[220px] snap-start">
                <ContentCard 
                  id={item.tmdb_id} 
                  type="movie" 
                  title={item.title} 
                  poster={item.poster} 
                  score={item.rating}
                  year={item.year}
                />
              </div>
            ))
          )}
        </HorizontalScrollRow>

        <HorizontalScrollRow title="Top Rated Anime">
          {topAnime?.items.map(item => (
            <div key={`topa-${item.mal_id}`} className="flex-none w-[160px] md:w-[220px] snap-start">
              <ContentCard 
                id={item.mal_id} 
                type="anime" 
                title={item.title_english || item.title} 
                poster={item.poster} 
                score={item.score}
                episodes={item.episodes}
              />
            </div>
          ))}
        </HorizontalScrollRow>
      </div>
    </div>
  );
}
