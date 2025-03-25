import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaGrid from "@/components/media/MediaGrid";
import { useAuth } from "@/components/auth/AuthContext";

export default function Favorites() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch favorites
  const { data: favorites, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/favorites`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/favorites`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Filter by media type
  const filteredItems = favorites?.filter((item: any) => {
    if (activeTab === "all") return true;
    return activeTab === "movies" ? item.media.type === "movie" : item.media.type === "tv";
  });

  if (!currentUser) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Your Favorites</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sign in to keep track of your favorite movies and shows.
        </p>
        <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Favorites</h1>
      
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
            emptyMessage="You haven't added any favorites yet."
          />
        </TabsContent>
        
        <TabsContent value="movies" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No favorite movies yet."
          />
        </TabsContent>
        
        <TabsContent value="tv" className="mt-6">
          <MediaGrid 
            items={filteredItems?.map((item: any) => item.media) || []}
            isLoading={isLoading}
            emptyMessage="No favorite TV shows yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
