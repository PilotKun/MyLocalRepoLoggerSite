import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaGrid from "@/components/media/MediaGrid";

export default function Watched() {
  // Mock user ID - this would come from auth context in a real app
  const userId = 1;
  
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");

  // Fetch watched items
  const { data: watched, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/watched`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${userId}/watched`);
        return await response.json();
      } catch (error) {
        // Return empty array if user not authenticated yet
        return [];
      }
    },
  });

  // Filter by media type
  const filteredItems = watched?.filter((item: any) => {
    if (activeTab === "all") return true;
    return activeTab === "movies" ? item.media.type === "movie" : item.media.type === "tv";
  });

  // Mock data for the empty state
  const isAuthenticated = false; // This would come from auth context
  
  if (!isAuthenticated) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Your Watch History</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sign in to keep track of movies and shows you've watched.
        </p>
        <Button>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Watch History</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "movies" | "tv")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV Shows</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []} 
            isLoading={isLoading}
            emptyMessage="Your watch history is empty. Start watching and rating content!"
          />
        </TabsContent>
        
        <TabsContent value="movies" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No movies in your watch history."
          />
        </TabsContent>
        
        <TabsContent value="tv" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No TV shows in your watch history."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
