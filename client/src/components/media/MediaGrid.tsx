import { TMDBMovie, TMDBTVShow } from "@shared/schema";
import MediaCard from "./MediaCard";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaGridProps {
  items: (TMDBMovie | TMDBTVShow)[];
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: {
    base: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export default function MediaGrid({
  items,
  isLoading = false,
  emptyMessage = "No items found",
  columns = {
    base: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 5,
  },
}: MediaGridProps) {
  const getGridCols = () => {
    const base = `grid-cols-${columns.base}`;
    const sm = columns.sm ? `sm:grid-cols-${columns.sm}` : "";
    const md = columns.md ? `md:grid-cols-${columns.md}` : "";
    const lg = columns.lg ? `lg:grid-cols-${columns.lg}` : "";
    const xl = columns.xl ? `xl:grid-cols-${columns.xl}` : "";
    
    return `${base} ${sm} ${md} ${lg} ${xl}`;
  };

  if (isLoading) {
    return (
      <div className={`mt-4 grid gap-1 ${getGridCols()}`}>
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex justify-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`mt-4 grid gap-1 ${getGridCols()}`}>
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}
