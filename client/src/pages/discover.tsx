import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getMovieGenres, 
  getTVGenres,
  discoverMoviesByGenre,
  discoverTVShowsByGenre
} from "@/lib/tmdb";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MediaGrid from "@/components/media/MediaGrid";

export default function Discover() {
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  
  // Fetch movie genres
  const { data: movieGenres } = useQuery({
    queryKey: ['/genre/movie/list'],
    queryFn: getMovieGenres,
  });
  
  // Fetch TV genres
  const { data: tvGenres } = useQuery({
    queryKey: ['/genre/tv/list'],
    queryFn: getTVGenres,
  });
  
  // Fetch movies by genre
  const { 
    data: moviesByGenre, 
    isLoading: moviesLoading, 
    refetch: refetchMovies 
  } = useQuery({
    queryKey: ['/discover/movie', selectedGenre],
    queryFn: () => discoverMoviesByGenre(parseInt(selectedGenre)),
    enabled: activeTab === "movies" && !!selectedGenre,
  });
  
  // Fetch TV shows by genre
  const { 
    data: tvByGenre, 
    isLoading: tvLoading,
    refetch: refetchTv
  } = useQuery({
    queryKey: ['/discover/tv', selectedGenre],
    queryFn: () => discoverTVShowsByGenre(parseInt(selectedGenre)),
    enabled: activeTab === "tv" && !!selectedGenre,
  });
  
  // Reset selected genre when tab changes
  useEffect(() => {
    setSelectedGenre("");
  }, [activeTab]);
  
  // Refetch when genre changes
  useEffect(() => {
    if (selectedGenre && activeTab === "movies") {
      refetchMovies();
    } else if (selectedGenre && activeTab === "tv") {
      refetchTv();
    }
  }, [selectedGenre, activeTab, refetchMovies, refetchTv]);
  
  const currentGenres = activeTab === "movies" 
    ? movieGenres?.genres || [] 
    : tvGenres?.genres || [];
  
  const isLoading = activeTab === "movies" ? moviesLoading : tvLoading;
  
  const mediaItems = activeTab === "movies" 
    ? moviesByGenre?.results || [] 
    : tvByGenre?.results || [];

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-3xl font-bold">Discover</h1>
      
      <Tabs defaultValue="movies" value={activeTab} onValueChange={(v) => setActiveTab(v as "movies" | "tv")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
          </TabsList>
          
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select a genre" />
            </SelectTrigger>
            <SelectContent>
              {currentGenres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="movies" className="mt-6">
          {!selectedGenre && !isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium">Select a genre to discover movies</p>
              <p className="text-sm text-muted-foreground">
                Choose from popular genres like Action, Drama, or Comedy
              </p>
            </div>
          ) : (
            <MediaGrid 
              items={mediaItems} 
              isLoading={isLoading}
              emptyMessage={selectedGenre ? "No movies found for this genre" : "Select a genre to see movies"}
            />
          )}
        </TabsContent>
        
        <TabsContent value="tv" className="mt-6">
          {!selectedGenre && !isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-lg font-medium">Select a genre to discover TV shows</p>
              <p className="text-sm text-muted-foreground">
                Choose from popular genres like Drama, Comedy, or Sci-Fi
              </p>
            </div>
          ) : (
            <MediaGrid 
              items={mediaItems}
              isLoading={isLoading}
              emptyMessage={selectedGenre ? "No TV shows found for this genre" : "Select a genre to see TV shows"}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
