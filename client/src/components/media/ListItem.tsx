import { Film, Tv, Star, Calendar, Trash2, ExternalLink, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/AuthContext";
import { getImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Rating from "./Rating";

interface ListItemProps {
  item: {
    id: number;
    listId: number;
    mediaId: number;
    tmdbId: number;
    title: string;
    type: "movie" | "tv";
    voteAverage: number;
    userRating?: number;
    seasonsWatched?: number;
    status?: string;
    createdAt?: string;
    posterPath?: string;
  };
  onRatingChange?: () => void;
  onEdit?: (item: ListItemProps['item']) => void;
}

export default function ListItem({ item, onRatingChange, onEdit }: ListItemProps) {
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
      console.log(`Submitting rating: MediaID=${item.mediaId}, UserID=${currentUser.uid}, Rating=${value}`);
      
      const response = await apiRequest("POST", `/api/media/${item.mediaId}/rate`, {
        userId: currentUser.uid,
        rating: value,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      console.log('Rating submitted successfully');
      
      toast({
        title: "Rating updated",
        description: "Your rating has been saved successfully.",
      });

      // Invalidate the specific media's rating query
      // The list query invalidation is handled by the onRatingChange callback
      queryClient.invalidateQueries({ queryKey: [`/api/media/${item.mediaId}`] });

      // Call the onRatingChange callback if provided
      onRatingChange?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link component from navigating
    e.stopPropagation(); // Prevent event bubbling

    if (!currentUser || !item.listId) {
      toast({
        title: "Error",
        description: "You must be signed in to remove items.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Deleting item:", { listId: item.listId, mediaId: item.mediaId });
      const response = await apiRequest("DELETE", `/api/lists/${item.listId}/items/${item.mediaId}`);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast({
        title: "Item removed",
        description: "The item has been removed from your list.",
      });

      // Invalidate the list query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${item.listId}`] });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status?: string) => {
    let color = "";
    let text = "";

    switch (status?.toLowerCase()) {
      case "watched":
        color = "bg-green-500/10 text-green-500 border-green-500/20";
        text = "Watched";
        break;
      case "watching":
        color = "bg-blue-500/10 text-blue-500 border-blue-500/20";
        text = "Currently Watching";
        break;
      case "watchlist":
        color = "bg-gray-500/10 text-gray-500 border-gray-500/20";
        text = "Plan to Watch";
        break;
      case "on hold":
        color = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        text = "On Hold";
        break;
      case "dropped":
        color = "bg-red-500/10 text-red-500 border-red-500/20";
        text = "Dropped";
        break;
      default:
        color = "bg-gray-500/10 text-gray-500 border-gray-500/20";
        text = "Not Set";
    }

    return (
      <Badge variant="outline" className={color}>
        {text}
      </Badge>
    );
  };

  const getSeasonsWatchedBadge = () => {
    if (item.type !== "tv" || !item.seasonsWatched) return null;

    return (
      <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
        {item.seasonsWatched} {item.seasonsWatched === 1 ? 'season' : 'seasons'} watched
      </Badge>
    );
  };

  console.log("ListItem props:", item);

  return (
    <div className="flex items-start gap-4 p-4">
      {/* Poster Image */}
      <div className="flex-shrink-0">
        <img
          src={item.posterPath ? getImageUrl(item.posterPath) : "/placeholder-poster.png"}
          alt={item.title}
          className="h-32 w-20 rounded-md object-cover shadow-md"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <a 
                href={`/media/${item.tmdbId}?type=${item.type}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {item.type === "movie" ? (
                <Film className="h-4 w-4" />
              ) : (
                <Tv className="h-4 w-4" />
              )}
              <span>{item.type === "movie" ? "Movie" : "TV Show"}</span>
              {item.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Added {formatDate(item.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(item.status)}
            {getSeasonsWatchedBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Edit icon clicked in ListItem for:", item.title);
                onEdit?.(item);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Remove the average rating display
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{(item.voteAverage / 10).toFixed(1)}/10</span>
          </div>
          */}
          <Rating
            value={item.userRating}
            onChange={handleRatingChange}
          />
        </div>
      </div>
    </div>
  );
} 