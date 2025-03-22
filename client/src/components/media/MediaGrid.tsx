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
    xl: 6,
  },
}: MediaGridProps) {
  // Use CSS classes directly instead of dynamic classes which might not be purged properly
  const getGridClass = () => {
    return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
  };

  if (isLoading) {
    return (
      <div className={`mt-4 ${getGridClass()} gap-3`}>
        {Array(12)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
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
    <div className={`mt-4 ${getGridClass()} gap-3`}>
      {items.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}
