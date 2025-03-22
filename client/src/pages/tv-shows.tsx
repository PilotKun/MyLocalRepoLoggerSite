import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPopularTVShows, getTrending } from "@/lib/tmdb";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MediaGrid from "@/components/media/MediaGrid";

export default function TVShows() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("popular");

  // Popular TV shows
  const { 
    data: popularData, 
    isLoading: popularLoading,
    isPreviousData: isPopularPreviousData
  } = useQuery({
    queryKey: ['/tv/popular', page],
    queryFn: () => getPopularTVShows(page),
    keepPreviousData: true
  });

  // Trending TV shows
  const { 
    data: trendingData, 
    isLoading: trendingLoading,
  } = useQuery({
    queryKey: ['/trending/tv/week'],
    queryFn: () => getTrending("tv"),
    enabled: activeTab === "trending"
  });

  const currentData = activeTab === "popular" ? popularData : trendingData;
  const isLoading = activeTab === "popular" ? popularLoading : trendingLoading;
  
  const hasNextPage = currentData?.page < currentData?.total_pages;
  const hasPrevPage = page > 1;

  const handleNextPage = () => {
    if (!isPopularPreviousData && hasNextPage) {
      setPage(old => old + 1);
    }
  };

  const handlePrevPage = () => {
    setPage(old => Math.max(old - 1, 1));
  };

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">TV Shows</h1>
      
      <Tabs defaultValue="popular" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="mt-6">
          <MediaGrid 
            items={popularData?.results || []} 
            isLoading={isLoading}
          />
          
          {popularData && (
            <div className="mt-8 flex items-center justify-between">
              <Button 
                onClick={handlePrevPage} 
                disabled={!hasPrevPage || isLoading}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {popularData.total_pages}
              </span>
              <Button 
                onClick={handleNextPage} 
                disabled={!hasNextPage || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-6">
          <MediaGrid 
            items={trendingData?.results || []} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
