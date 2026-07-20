import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface HorizontalScrollRowProps {
  title: string;
  children: React.ReactNode;
}

export function HorizontalScrollRow({ title, children }: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth + 100 : scrollLeft + clientWidth - 100;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white relative inline-block">
          {title}
          <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
        </h2>
        <div className="flex items-center gap-2 hidden md:flex">
          <Button variant="outline" size="icon" onClick={() => scroll("left")} className="rounded-full bg-transparent border-white/10 hover:bg-white/10 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll("right")} className="rounded-full bg-transparent border-white/10 hover:bg-white/10 hover:text-white">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 px-4 container mx-auto snap-x snap-mandatory scrollbar-none pb-8 pt-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
