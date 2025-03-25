import { Film, Tv, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/AuthContext";
import Rating from "./Rating";

interface ListItemProps {
  item: {
    id: number;
    mediaId: number;
    title: string;
    type: "movie" | "tv";
    voteAverage: number;
    userRating?: number;
    seasonsWatched?: number;
  };
  onRatingChange?: () => void;
}

export default function ListItem({ item, onRatingChange }: ListItemProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleRatingChange = async (value: number) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be signed in to rate media.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", `/api/media/${item.mediaId}/rate`, {
        userId: currentUser.uid,
        rating: value,
      });

      toast({
        title: "Rating updated",
        description: "Your rating has been saved successfully.",
      });

      onRatingChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-2">
      <div className="flex items-center gap-2">
        {item.type === "movie" ? (
          <Film className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Tv className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">{item.title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{item.voteAverage}/10</span>
        </div>
        <Rating
          value={item.userRating}
          onChange={handleRatingChange}
        />
        {item.type === "tv" && item.seasonsWatched !== undefined && item.seasonsWatched > 0 && (
          <span className="text-sm text-muted-foreground">
            {item.seasonsWatched} {item.seasonsWatched === 1 ? 'season' : 'seasons'}
          </span>
        )}
      </div>
    </div>
  );
} 