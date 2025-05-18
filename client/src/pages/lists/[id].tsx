import { useState, useMemo } from "react";
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
  DialogTitle 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListPlus, Globe, Lock, Trash2, ArrowLeft, Plus, Film, Tv, Search, X, List, LayoutGrid, Filter } from "lucide-react";
import { Link } from "wouter";
import ListItem from "@/components/media/ListItem";
import { searchMedia } from "@/lib/tmdb";
import EditItemDialog from "@/components/media/EditItemDialog";
import GridItem from "@/components/media/GridItem";

// Define the type for a list item
export type ListItemData = {
  id: number; // list_item id
  listId: number;
  mediaId: number;
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string | null; // Reverted to string | null
  voteAverage: number;     // Must be a number
  userRating?: number;
  seasonsWatched?: number;
  status?: string;          // Changed to string | undefined based on GridItem errors
  createdAt?: string;
};

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // State for filters
  const [showOnlyMovies, setShowOnlyMovies] = useState(false);
  const [showOnlySeries, setShowOnlySeries] = useState(false);
  const [showRated, setShowRated] = useState(false);
  const [showUnrated, setShowUnrated] = useState(false);
  // New filter states
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterDateAdded, setFilterDateAdded] = useState<string | undefined>(undefined);

  // Define available statuses for filtering
  const availableStatuses: WatchStatus[] = ["watched", "watchlist", "watching", "on hold", "dropped"];

  if (!match) {
    navigate("/not-found");
    return null;
  }

  const listId = parseInt(params.id);

  // Fetch list details
  const { data: list, isLoading } = useQuery({
    queryKey: [`/api/lists/${listId}`, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null;
      try {
        const response = await apiRequest("GET", `/api/lists/${listId}?userId=${currentUser.uid}`);
        const list = await response.json();
        return list;
      } catch (error) {
        console.error("Error fetching list:", error);
        return null;
      }
    },
    enabled: !!currentUser,
  });

  const mappedListItems = useMemo(() => {
    if (!list?.items) return [];
    return list.items.map((itemData: any): ListItemData => ({
      id: itemData.id,
      listId: list.id,
      mediaId: itemData.media.id,
      tmdbId: itemData.media.tmdbId,
      title: itemData.media.title,
      type: itemData.media.type,
      voteAverage: itemData.media.voteAverage || 0,
      seasonsWatched: itemData.seasonsWatched,
      status: itemData.status,
      createdAt: itemData.createdAt,
      posterPath: itemData.media.posterPath || null,
      userRating: itemData.userRating,
    }));
  }, [list]);

  const filteredItems = useMemo(() => {
    let itemsToFilter = [...mappedListItems];

    // Type filter
    if (showOnlyMovies && !showOnlySeries) {
      itemsToFilter = itemsToFilter.filter(item => item.type === "movie");
    } else if (showOnlySeries && !showOnlyMovies) {
      itemsToFilter = itemsToFilter.filter(item => item.type === "tv");
    }
    // If both are true or both are false, no type filtering is applied, showing all types.

    // Rating filter
    if (showRated && !showUnrated) {
      itemsToFilter = itemsToFilter.filter(item => typeof item.userRating === 'number');
    } else if (showUnrated && !showRated) {
      itemsToFilter = itemsToFilter.filter(item => typeof item.userRating !== 'number' || item.userRating === null || item.userRating === undefined);
    }
    // If both are true or both are false, no rating filtering is applied.

    // Status filter
    if (filterStatus) {
      itemsToFilter = itemsToFilter.filter(item => item.status === filterStatus);
    }

    // Date Added filter (sorting - can be enhanced later)
    if (filterDateAdded) {
      itemsToFilter.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        if (filterDateAdded === 'newest') {
          return dateB - dateA;
        } else if (filterDateAdded === 'oldest') {
          return dateA - dateB;
        }
        return 0;
      });
    }

    return itemsToFilter;
  }, [mappedListItems, showOnlyMovies, showOnlySeries, showRated, showUnrated, filterStatus, filterDateAdded]);

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
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/lists">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading list...</h1>
        </div>
        <Card className="animate-pulse">
          <CardHeader className="h-24 bg-muted/50" />
          <CardContent className="p-4">
            <div className="h-5 w-2/3 rounded bg-muted/50" />
            <div className="mt-2 h-3 w-full rounded bg-muted/50" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">List Not Found</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          The list you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/lists")}>Go to Lists</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/lists">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ListPlus className="h-6 w-6" />
              {list.name}
              {list.isPublic ? (
                <Globe className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </h1>
            {list.description && (
              <p className="text-muted-foreground mt-1">{list.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="gap-2"
            onClick={() => setQuickAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showOnlyMovies}
                onCheckedChange={setShowOnlyMovies}
              >
                Movies Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showOnlySeries}
                onCheckedChange={setShowOnlySeries}
              >
                Series Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Rating</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showRated}
                onCheckedChange={setShowRated}
              >
                Rated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showUnrated}
                onCheckedChange={setShowUnrated}
              >
                Unrated
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Placeholder for status options - this might be a sub-menu or multiple checkboxes */}
              {availableStatuses.map(statusOption => (
                <DropdownMenuCheckboxItem
                  key={statusOption}
                  checked={filterStatus === statusOption}
                  onCheckedChange={(checked) => setFilterStatus(checked ? statusOption : undefined)}
                >
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort by Date Added</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Placeholder for date added options */}
              <DropdownMenuCheckboxItem
                checked={filterDateAdded === 'newest'}
                onCheckedChange={(checked) => setFilterDateAdded(checked ? 'newest' : undefined)}
              >
                Newest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterDateAdded === 'oldest'}
                onCheckedChange={(checked) => setFilterDateAdded(checked ? 'oldest' : undefined)}
              >
                Oldest First
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-2"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete List
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-[auto_auto] justify-start">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Grid
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {!list.items || list.items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">This list is empty.</p>
            <p className="text-sm text-muted-foreground">Add movies or TV shows to your list!</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">No items match your current filters.</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filter criteria.</p>
          </div>
        ) : (
          viewMode === "list" ? (
            filteredItems.map((mappedItem: ListItemData) => {
              // Map the fetched data to the expected ListItemData structure
              return (
                <Card key={mappedItem.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-0"> 
                    <ListItem 
                      item={{
                        ...mappedItem,
                        posterPath: mappedItem.posterPath || undefined
                      }}
                      onEdit={(itemFromListItem) => handleEditClick({
                        ...itemFromListItem,
                        posterPath: itemFromListItem.posterPath === undefined ? null : itemFromListItem.posterPath,
                      })}
                      onRatingChange={() => {
                        console.log(`Invalidating list ${listId} for user ${currentUser?.uid}`);
                        queryClient.invalidateQueries({ 
                          queryKey: [`/api/lists/${listId}`, currentUser?.uid],
                          refetchType: 'active'
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Placeholder for Grid View
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems.map((mappedItem: ListItemData) => {
                return (
                  <GridItem 
                    key={`${mappedItem.id}-${mappedItem.mediaId}`} 
                    item={mappedItem}
                    onEdit={(itemFromListItem) => handleEditClick({
                      ...itemFromListItem,
                      posterPath: itemFromListItem.posterPath === undefined ? null : itemFromListItem.posterPath,
                    })}
                  />
                );
              })}
            </div>
          )
        )}
      </div>
      
      {/* Edit Item Dialog */}
      <EditItemDialog 
        item={editingItem} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        // Optionally add onSaved if needed later, e.g., for specific refresh logic
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
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

      {/* Quick Add Dialog */}
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