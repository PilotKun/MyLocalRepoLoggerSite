import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaGrid from "@/components/media/MediaGrid";
import { TMDBMovie, TMDBTVShow } from "@shared/schema";
import { useAuth } from "@/components/auth/AuthContext";

export default function Watchlist() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");

  // Fetch watchlist
  const { data: watchlist, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/watchlist`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/watchlist`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Filter by media type
  const filteredItems = watchlist?.filter((item: any) => {
    if (activeTab === "all") return true;
    return activeTab === "movies" ? item.media.type === "movie" : item.media.type === "tv";
  });

  if (!currentUser) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Your Watchlist</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sign in to keep track of movies and shows you want to watch.
        </p>
        <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Watchlist</h1>
      
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
            emptyMessage="Your watchlist is empty. Add movies and shows to watch later."
          />
        </TabsContent>
        
        <TabsContent value="movies" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No movies in your watchlist. Add some to watch later."
          />
        </TabsContent>
        
        <TabsContent value="tv" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No TV shows in your watchlist. Add some to watch later."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
