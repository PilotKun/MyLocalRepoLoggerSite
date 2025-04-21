import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListPlus, Globe, Lock, Trash2, ArrowLeft, Plus, Film, Tv, Search, X } from "lucide-react";
import { Link } from "wouter";
import ListItem from "@/components/media/ListItem";
import { searchMedia } from "@/lib/tmdb";
import EditItemDialog from "@/components/media/EditItemDialog";

// Define the type for a list item based on ListItemProps
// This helps ensure consistency
type ListItemData = React.ComponentProps<typeof ListItem>['item'];

// Status options for media items
type WatchStatus = "watched" | "watchlist" | "watching" | "on hold" | "dropped";

interface MediaSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
}

export default function ListDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/lists/:id");
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaSearchResult | null>(null);
  const [status, setStatus] = useState<WatchStatus>("watchlist");
  const [seasonsWatched, setSeasonsWatched] = useState<number>(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItemData | null>(null);

  if (!match) {
    navigate("/not-found");
    return null;
  }

  const listId = parseInt(params.id);

  // Fetch list details
  const { data: listData, isLoading, error } = useQuery({
    queryKey: [`/api/lists/${listId}`, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null;
      try {
        const response = await apiRequest("GET", `/api/lists/${listId}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log('List not found (404)');
            return null;
          }
          throw new Error(`API responded with status ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched list details and items:", data);
        return data;
      } catch (err) {
        console.error("Error fetching list details:", err);
        return null;
      }
    },
    enabled: !!currentUser && !isNaN(listId),
  });

  const handleDeleteList = async () => {
    if (!currentUser) return;
    
    try {
      await apiRequest("DELETE", `/api/lists/${listId}`);
      
      toast({
        title: "List deleted",
        description: "Your list has been deleted successfully."
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser.uid}/lists`] });
      navigate("/lists");
    } catch (error) {
      console.error("Error deleting list:", error);
      toast({
        title: "Error",
        description: "Failed to delete list. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchMedia(searchQuery);
      setSearchResults(results.slice(0, 5) as MediaSearchResult[]);
    } catch (error) {
      console.error("Error searching media:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const selectMedia = (media: MediaSearchResult) => {
    setSelectedMedia(media);
    setSearchResults([]);
    
    // Reset values
    setStatus("watchlist");
    setSeasonsWatched(0);
  };

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
  };

  const handleAddToList = async () => {
    if (!currentUser || !selectedMedia) return;
    
    setAddLoading(true);
    try {
      console.log("Starting add to list process with media:", selectedMedia);
      
      // First check if media exists in database, if not create it
      let mediaId: number;
      
      try {
        console.log(`Checking if media exists: ${selectedMedia.id}, type: ${selectedMedia.media_type}`);
        const mediaCheckResponse = await apiRequest("GET", `/api/media/check/${selectedMedia.id}?type=${selectedMedia.media_type}`);
        
        if (mediaCheckResponse.status === 404 || !mediaCheckResponse.ok) {
          throw new Error("Media not found");
        }
        
        const existingMedia = await mediaCheckResponse.json();
        mediaId = existingMedia.id;
        console.log("Media exists with ID:", mediaId);
      } catch (error) {
        // Media doesn't exist, create it
        console.log("Media not found, creating new media item");
        const createMediaPayload = {
          tmdbId: selectedMedia.id,
          type: selectedMedia.media_type,
          title: selectedMedia.title,
          posterPath: selectedMedia.poster_path,
          releaseDate: selectedMedia.release_date || selectedMedia.first_air_date,
        };
        
        console.log("Creating media with payload:", createMediaPayload);
        const createMediaResponse = await apiRequest("POST", "/api/media", createMediaPayload);
        
        if (!createMediaResponse.ok) {
          const errorData = await createMediaResponse.text();
          throw new Error(`Failed to create media: ${errorData}`);
        }
        
        const createdMedia = await createMediaResponse.json();
        mediaId = createdMedia.id;
        console.log("Created new media with ID:", mediaId);
      }
      
      // Now add media to the list
      const listId = parseInt(params.id);
      if (isNaN(listId)) {
        throw new Error("Invalid list ID");
      }
      
      // Validate status
      const validStatuses = ["watched", "watchlist", "watching", "on hold", "dropped"];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
      }
      
      const addToListPayload = {
        listId,
        mediaId,
        status,
        seasonsWatched: selectedMedia.media_type === "tv" ? seasonsWatched : undefined,
      };
      
      console.log("Adding to list with payload:", addToListPayload);
      
      const addResponse = await apiRequest("POST", "/api/list-items", addToListPayload);
      
      if (!addResponse.ok) {
        const errorData = await addResponse.text();
        throw new Error(`Failed to add to list: ${errorData}`);
      }
      
      const addedItem = await addResponse.json();
      console.log("Successfully added item to list:", addedItem);
      
      toast({
        title: "Added to list",
        description: `${selectedMedia.title} has been added to your list.`
      });
      
      // Refresh list data
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}`, currentUser?.uid] });
      
      // Close dialog and reset state
      setQuickAddOpen(false);
      setSelectedMedia(null);
      setStatus("watchlist"); // Reset status to default
      setSeasonsWatched(0); // Reset seasons watched
      
    } catch (error) {
      console.error("Error adding to list:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  // Function to open the edit dialog
  const handleEditClick = (item: ListItemData) => {
    console.log("Editing item:", item);
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-6 text-center md:px-6 md:py-8">
        Loading list details...
      </div>
    );
  }

  if (!listData) {
    return (
      <div className="container px-4 py-6 text-center md:px-6 md:py-8">
        <h1 className="mb-4 text-2xl font-bold">List Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The list you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/lists">
          <Button variant="outline">Back to Lists</Button>
        </Link>
      </div>
    );
  }

  const { items, ...listDetails } = listData;

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lists">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {listDetails.isPublic ? (
              <Globe className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            {listDetails.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuickAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Quick Add
          </Button>
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete List
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete List</DialogTitle>
                <DialogDescription>
                  Do you really want to delete this list? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  No
                </Button>
                <Button variant="destructive" onClick={handleDeleteList}>
                  Yes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {listDetails.description && (
        <p className="mb-6 text-muted-foreground">{listDetails.description}</p>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="movies">
            Movies ({items.filter(item => item.media.type === 'movie').length})
          </TabsTrigger>
          <TabsTrigger value="shows">
            TV Shows ({items.filter(item => item.media.type === 'tv').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">
                This list is empty. Use "Quick Add" to add movies and shows.
              </p>
            ) : (
              items.map((item) => (
                <ListItem
                  key={item.listItemId}
                  item={item}
                  onEditClick={() => handleEditClick(item)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="movies">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.filter(item => item.media.type === 'movie').length === 0 ? (
               <p className="col-span-full text-center text-muted-foreground">
                No movies in this list yet.
              </p>
            ) : (
              items
                .filter(item => item.media.type === 'movie')
                .map((item) => (
                  <ListItem 
                    key={item.listItemId} 
                    item={item} 
                    onEditClick={() => handleEditClick(item)}
                  />
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="shows">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.filter(item => item.media.type === 'tv').length === 0 ? (
               <p className="col-span-full text-center text-muted-foreground">
                No TV shows in this list yet.
              </p>
            ) : (
              items
                .filter(item => item.media.type === 'tv')
                .map((item) => (
                  <ListItem 
                    key={item.listItemId} 
                    item={item} 
                    onEditClick={() => handleEditClick(item)}
                  />
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <EditItemDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        itemData={editingItem}
        listId={listId}
      />

      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add to List</DialogTitle>
            <DialogDescription>
              Search for movies or TV shows to add to your list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedMedia ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search movies or TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                  <Button 
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searchLoading}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchLoading && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {searchResults.map((result) => (
                      <Card 
                        key={`${result.id}-${result.media_type}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => selectMedia(result)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {result.media_type === 'movie' ? (
                              <Film className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Tv className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{result.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {result.media_type === 'movie' ? 'Movie' : 'TV Show'} • 
                              {result.release_date || result.first_air_date 
                                ? new Date(result.release_date || result.first_air_date || '').getFullYear() 
                                : 'Unknown year'}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {searchResults.length === 0 && searchQuery && !searchLoading && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No results found. Try another search.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="border-primary">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {selectedMedia.media_type === 'movie' ? (
                        <Film className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Tv className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{selectedMedia.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedMedia.media_type === 'movie' ? 'Movie' : 'TV Show'} • 
                        {selectedMedia.release_date || selectedMedia.first_air_date 
                          ? new Date(selectedMedia.release_date || selectedMedia.first_air_date || '').getFullYear() 
                          : 'Unknown year'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={clearSelectedMedia}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Status
                    </label>
                    <Select 
                      value={status} 
                      onValueChange={(value: WatchStatus) => setStatus(value as WatchStatus)}
                      defaultValue="watchlist"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="watched">Watched</SelectItem>
                        <SelectItem value="watching">Currently Watching</SelectItem>
                        <SelectItem value="watchlist">Plan to Watch</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                        <SelectItem value="dropped">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMedia.media_type === 'tv' && (
                    <div>
                      <label className="text-sm font-medium block mb-1">
                        Seasons Watched
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        defaultValue="0"
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setSeasonsWatched(isNaN(value) ? 0 : value);
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button 
                    onClick={handleAddToList} 
                    disabled={addLoading}
                    className="w-full"
                  >
                    {addLoading ? "Adding..." : "Add to List"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            {!selectedMedia ? (
              <Button variant="outline" onClick={() => setQuickAddOpen(false)}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={clearSelectedMedia}>
                Back to Search
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 