import { Link } from "wouter";
import { Star, Play } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ContentCardProps {
  id: number | string;
  type: "anime" | "movie";
  title: string;
  poster?: string | null;
  score?: number | null;
  year?: number | null;
  episodes?: number | null;
  status?: string;
  genres?: string[];
}

export function ContentCard({ id, type, title, poster, score, year, episodes, status, genres }: ContentCardProps) {
  const href = type === "anime" ? `/anime/${id}` : `/movies/${id}`;

  return (
    <Link href={href} className="group block relative w-full aspect-[2/3] rounded-xl overflow-hidden card-lift bg-card border border-white/5">
      {poster ? (
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <span className="text-muted-foreground font-medium text-sm">No Poster</span>
        </div>
      )}
      
      {/* Top badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 items-end z-10">
        {score && (
          <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-none text-white font-semibold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            {score.toFixed(1)}
          </Badge>
        )}
        {type === "anime" && episodes && (
          <Badge variant="outline" className="bg-black/60 backdrop-blur-md border-none text-white/90 text-xs font-medium">
            {episodes} EP
          </Badge>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <h3 className="font-display font-bold text-white text-lg leading-tight mb-1 line-clamp-2">
            {title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70 mb-4">
            {year && <span>{year}</span>}
            {year && (genres?.length || status) && <span className="w-1 h-1 rounded-full bg-white/30" />}
            {type === "anime" && status && <span>{status}</span>}
            {type === "anime" && status && genres?.length && <span className="w-1 h-1 rounded-full bg-white/30" />}
            {genres && genres.length > 0 && (
              <span className="truncate">{genres.slice(0, 2).join(", ")}</span>
            )}
          </div>

          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full">
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            View Details
          </Button>
        </div>
      </div>
    </Link>
  );
}
