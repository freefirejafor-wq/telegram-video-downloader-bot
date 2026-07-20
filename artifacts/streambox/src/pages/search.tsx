import { useState, useEffect } from "react";
import { useSearchAnime, useSearchMovies } from "@workspace/api-client-react";
import { ContentCard } from "@/components/content-card";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2, Tv, Film } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [activeTab, setActiveTab] = useState<"anime" | "movies">("anime");

  const { data: animeResults, isFetching: loadingAnime } = useSearchAnime(
    { q: debouncedQuery }, 
    { query: { enabled: activeTab === "anime" && debouncedQuery.length >= 3, queryKey: ['search-anime', debouncedQuery] } }
  );

  const { data: movieResults, isFetching: loadingMovies } = useSearchMovies(
    { q: debouncedQuery }, 
    { query: { enabled: activeTab === "movies" && debouncedQuery.length >= 3, queryKey: ['search-movie', debouncedQuery] } }
  );

  const isSearching = activeTab === "anime" ? loadingAnime : loadingMovies;
  const hasQuery = debouncedQuery.length >= 3;
  const results = activeTab === "anime" ? animeResults?.items : movieResults?.items;

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <SearchIcon className="h-6 w-6" />
          </div>
          <Input
            type="search"
            placeholder="Search for movies, anime, shows..."
            className="w-full h-16 pl-14 pr-4 bg-white/5 border-white/10 rounded-2xl text-lg text-white placeholder:text-white/30 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 shadow-xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="anime" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full">
            <TabsTrigger value="anime" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Tv className="w-4 h-4 mr-2" /> Anime
            </TabsTrigger>
            <TabsTrigger value="movies" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Film className="w-4 h-4 mr-2" /> Movies
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8">
          {!hasQuery ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
              <SearchIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg">Type at least 3 characters to search</p>
            </div>
          ) : isSearching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-full aspect-[2/3] bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((item, index) => (
                <div 
                  key={activeTab === "anime" ? (item as any).mal_id : (item as any).tmdb_id}
                  className="animate-in fade-in zoom-in slide-in-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <ContentCard 
                    id={activeTab === "anime" ? (item as any).mal_id : (item as any).tmdb_id}
                    type={activeTab === "anime" ? "anime" : "movie"}
                    title={activeTab === "anime" ? ((item as any).title_english || item.title) : item.title}
                    poster={item.poster}
                    score={activeTab === "anime" ? (item as any).score : (item as any).rating}
                    year={item.year}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl text-white font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
