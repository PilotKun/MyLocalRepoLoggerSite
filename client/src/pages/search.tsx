import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaGrid from "@/components/media/MediaGrid";
import { searchMulti, searchMovies, searchTVShows } from "@/lib/tmdb";

export default function Search() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = queryParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // All results search
  const { 
    data: multiResults, 
    isLoading: multiLoading 
  } = useQuery({
    queryKey: ['/search/multi', debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: !!debouncedQuery && activeTab === "all",
  });

  // Movies search
  const { 
    data: movieResults, 
    isLoading: moviesLoading 
  } = useQuery({
    queryKey: ['/search/movie', debouncedQuery],
    queryFn: () => searchMovies(debouncedQuery),
    enabled: !!debouncedQuery && activeTab === "movies",
  });

  // TV shows search
  const { 
    data: tvResults, 
    isLoading: tvLoading 
  } = useQuery({
    queryKey: ['/search/tv', debouncedQuery],
    queryFn: () => searchTVShows(debouncedQuery),
    enabled: !!debouncedQuery && activeTab === "tv",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const results = activeTab === "all" 
    ? multiResults?.results || [] 
    : activeTab === "movies" 
      ? movieResults?.results || [] 
      : tvResults?.results || [];
      
  const isLoading = activeTab === "all" 
    ? multiLoading 
    : activeTab === "movies" 
      ? moviesLoading 
      : tvLoading;

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">Search</h1>
      
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9"
            placeholder="Search for movies, TV shows, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
      </form>
      
      {debouncedQuery ? (
        <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "movies" | "tv")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <MediaGrid 
              items={results} 
              isLoading={isLoading}
              emptyMessage="No results found"
            />
          </TabsContent>
          
          <TabsContent value="movies" className="mt-6">
            <MediaGrid 
              items={results}
              isLoading={isLoading}
              emptyMessage="No movies found"
            />
          </TabsContent>
          
          <TabsContent value="tv" className="mt-6">
            <MediaGrid 
              items={results}
              isLoading={isLoading}
              emptyMessage="No TV shows found"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex h-60 flex-col items-center justify-center text-center">
          <SearchIcon className="mb-2 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Search for something</h2>
          <p className="text-muted-foreground">
            Enter a movie, TV show, or person name to see results.
          </p>
        </div>
      )}
    </div>
  );
}
