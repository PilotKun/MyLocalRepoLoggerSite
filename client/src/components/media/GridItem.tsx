import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Film, Tv, Star, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";

// Assuming ListItemData is defined elsewhere and imported, or define it here
// For now, let's use a basic type structure based on what's in [id].tsx
export interface ListItemData {
  id: number; // list_item ID
  listId: number;
  mediaId: number; // internal DB media ID
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string | null;
  voteAverage: number;
  userRating?: number;
  seasonsWatched?: number;
  status?: string;
  createdAt?: string;
}

interface GridItemProps {
  item: ListItemData;
  onEdit: (item: ListItemData) => void;
}

const GridItem: React.FC<GridItemProps> = ({ item, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [, navigate] = useLocation();

  const handleNavigateToDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card click event if called from button
    navigate(`/media/${item.tmdbId}?type=${item.type}`);
  };

  return (
    <Card 
      className="aspect-[2/3] overflow-hidden relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => handleNavigateToDetails()} // Main click navigates to details
    >
      <div className="w-full h-full">
        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            {item.type === "movie" ? (
              <Film className="h-12 w-12 text-muted-foreground" />
            ) : (
              <Tv className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Hover Overlay: Semi-transparent background shown on hover */} 
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none ${isHovered ? 'bg-opacity-30' : 'bg-opacity-0'}`} 
      />

      {/* Action Buttons: Top Left (External Link) and Top Right (Edit) */}
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={`bg-background/70 hover:bg-background/90 text-foreground rounded-full transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-auto"}`}
          onClick={handleNavigateToDetails} // Re-use navigation logic
          aria-label="View details"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>

      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={`bg-background/70 hover:bg-background/90 text-foreground rounded-full transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-auto"}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            onEdit(item);
          }}
          aria-label="Edit item"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* User Rating: Bottom Left */}
      {item.userRating !== undefined && item.userRating !== null && item.userRating > 0 && (
        <div className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-xs transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{item.userRating.toFixed(1)}</span>
        </div>
      )}

      {/* Optional: Display title at the bottom */}
      {/* <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-white text-sm font-semibold truncate">{item.title}</h3>
      </div> */}
    </Card>
  );
};

export default GridItem; 