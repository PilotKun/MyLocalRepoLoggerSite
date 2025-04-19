import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define the type for the item being edited (consistent with ListItemData in ListDetail)
type EditableItem = {
  id: number; // This is the list_item ID
  listId: number;
  mediaId: number;
  title: string;
  type: "movie" | "tv";
  status?: string;
  seasonsWatched?: number;
};

// Status options
type WatchStatus = "watched" | "watchlist" | "watching" | "on hold" | "dropped";
const watchStatuses: WatchStatus[] = ["watched", "watching", "watchlist", "on hold", "dropped"];

interface EditItemDialogProps {
  item: EditableItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void; // Optional callback after saving
}

export default function EditItemDialog({ item, open, onOpenChange, onSaved }: EditItemDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<WatchStatus>("watched");
  const [seasonsWatched, setSeasonsWatched] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when the item prop changes (when a new item is selected for editing)
  useEffect(() => {
    if (item) {
      setStatus((item.status as WatchStatus) || "watched");
      setSeasonsWatched(item.seasonsWatched || 0);
    } else {
      // Reset when dialog closes or item is null
      setStatus("watched");
      setSeasonsWatched(0);
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    setIsLoading(true);
    console.log("Saving changes for item:", item.id, { status, seasonsWatched });

    try {
      // --- Implement API Call ---
      const response = await apiRequest("PUT", `/api/list-items/${item.id}`, {
        status,
        // Only include seasonsWatched if it's a TV show, otherwise send undefined
        seasonsWatched: item.type === 'tv' ? seasonsWatched : undefined,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update item");
      }
      // -------------------------

      toast({
        title: "Item Updated",
        description: `${item.title} has been updated successfully.`,
      });

      // --- Invalidate query after successful API call ---
      // Use the correct query key format including user ID if needed, based on ListDetail fetch
      // Assuming the ListDetail query key includes the userId:
      // queryClient.invalidateQueries({ queryKey: [`/api/lists/${item.listId}`, currentUser?.uid] });
      // If ListDetail query doesn't include userId (e.g., for public lists viewed anonymously):
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${item.listId}`] }); 
      // ---------------------------------------------------
      
      onSaved?.(); // Call the optional saved callback
      onOpenChange(false); // Close the dialog
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null; // Don't render anything if no item is selected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit: {item.title}</DialogTitle>
          <DialogDescription>
            Update the details for this item in your list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value: WatchStatus) => setStatus(value)}
              defaultValue="watched"
              name="status"
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {watchStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} {/* Capitalize */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seasons Watched (only for TV) */}
          {item.type === 'tv' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seasonsWatched" className="text-right">
                Seasons Watched
              </Label>
              <Input
                id="seasonsWatched"
                name="seasonsWatched"
                type="number"
                min="0"
                value={seasonsWatched}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setSeasonsWatched(isNaN(value) ? 0 : value);
                }}
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 