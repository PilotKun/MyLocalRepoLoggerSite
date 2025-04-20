import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getMovieDetails, getTVShowDetails, getMovieRecommendations, getTVShowRecommendations } from "@/lib/tmdb";
import { getImageUrl, formatRuntime, formatDate } from "@/lib/utils";
import { TMDBMovie, TMDBTVShow } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  Star, 
  Share, 
  Clock, 
  CalendarDays, 
  ListPlus, 
  CheckSquare 
} from "lucide-react";
import MediaGrid from "@/components/media/MediaGrid";

// Define a union type for the details
type TMDBDetails = TMDBMovie | TMDBTVShow;

export default function MediaDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/media/:id");
  const { toast } = useToast();

  if (!match) {
    navigate("/not-found");
    return null;
  }

  const mediaId = parseInt(params.id);
  const searchParams = new URLSearchParams(window.location.search);
  const mediaType = searchParams.get("type") || "movie";
  
  // Fetch media details based on type
  const { data: mediaDetails, isLoading: detailsLoading } = useQuery<TMDBDetails | undefined>({
    queryKey: [`/${mediaType}/${mediaId}`],
    queryFn: () => mediaType === "movie" 
      ? getMovieDetails(mediaId) 
      : getTVShowDetails(mediaId),
  });
  
  // Fetch recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: [`/${mediaType}/${mediaId}/recommendations`],
    queryFn: () => mediaType === "movie" 
      ? getMovieRecommendations(mediaId) 
      : getTVShowRecommendations(mediaId),
    enabled: !!mediaDetails,
  });

  // Mock user ID - this would come from auth context in a real app
  const userId = 1;
  const isAuthenticated = false; // This would come from auth context

  // Check if item is in user's lists
  const { data: isInWatchlist } = useQuery({
    queryKey: [`/api/users/${userId}/watchlist/check`, mediaId],
    queryFn: async () => {
      try {
        // In a real app, this would check if the item is in the user's watchlist
        return false;
      } catch (error) {
        return false;
      }
    },
    enabled: isAuthenticated,
  });

  const { data: isWatched } = useQuery({
    queryKey: [`/api/users/${userId}/watched/check`, mediaId],
    queryFn: async () => {
      try {
        // In a real app, this would check if the item is watched
        return false;
      } catch (error) {
        return false;
      }
    },
    enabled: isAuthenticated,
  });

  const { data: isInFavorites } = useQuery({
    queryKey: [`/api/users/${userId}/favorites/check`, mediaId],
    queryFn: async () => {
      try {
        // In a real app, this would check if the item is in favorites
        return false;
      } catch (error) {
        return false;
      }
    },
    enabled: isAuthenticated,
  });

  // Add to watchlist
  const handleAddToWatchlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your watchlist",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/watchlist", {
        userId,
        mediaId: mediaDetails?.id,
      });

      toast({
        title: "Added to watchlist",
        description: `${mediaType === "movie" ? (mediaDetails as TMDBMovie)?.title : (mediaDetails as TMDBTVShow)?.name} has been added to your watchlist`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/watchlist`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/watchlist/check`, mediaId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mark as watched
  const handleMarkAsWatched = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to mark items as watched",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/watched", {
        userId,
        mediaId: mediaDetails?.id,
      });

      toast({
        title: "Marked as watched",
        description: `${mediaType === "movie" ? (mediaDetails as TMDBMovie)?.title : (mediaDetails as TMDBTVShow)?.name} has been marked as watched`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/watched`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/watched/check`, mediaId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as watched. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add to favorites
  const handleAddToFavorites = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to your favorites",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/favorites", {
        userId,
        mediaId: mediaDetails?.id,
      });

      toast({
        title: "Added to favorites",
        description: `${mediaType === "movie" ? (mediaDetails as TMDBMovie)?.title : (mediaDetails as TMDBTVShow)?.name} has been added to your favorites`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/favorites`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/favorites/check`, mediaId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (detailsLoading) {
    return (
      <div className="container px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <div className="overflow-hidden rounded-lg">
            <Skeleton className="aspect-[2/3] w-full" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mediaDetails) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Media Not Found</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          The movie or TV show you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </div>
    );
  }
  // Extract data based on media type
  const title = mediaType === "movie" 
    ? (mediaDetails as TMDBMovie).title 
    : (mediaDetails as TMDBTVShow).name;
  const releaseDate = mediaType === "movie" 
    ? (mediaDetails as TMDBMovie).release_date 
    : (mediaDetails as TMDBTVShow).first_air_date;
  const overview = mediaDetails.overview;
  const posterPath = mediaDetails.poster_path;
  const backdropPath = mediaDetails.backdrop_path;
  const voteAverage = mediaDetails.vote_average;
  
  // Handle runtime (movie) vs episode runtime (TV)
  const runtime = mediaType === "movie" 
    ? (mediaDetails as any).runtime 
    : ((mediaDetails as any).episode_run_time?.[0] || 0);

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      {/* Media Header */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-cover bg-center" 
        style={{ backgroundImage: `url(${getImageUrl(backdropPath, 'original')})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20"></div>
        <div className="grid gap-6 p-6 md:grid-cols-[300px_1fr] md:p-8">
          <div className="relative z-10 overflow-hidden rounded-lg">
            <img 
              src={getImageUrl(posterPath)} 
              alt={title} 
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
          
          <div className="relative z-10 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
              
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{(voteAverage / 10).toFixed(1)}</span>
                </div>
                {releaseDate && (
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(releaseDate).getFullYear()}</span>
                  </div>
                )}
                {runtime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatRuntime(runtime)}</span>
                  </div>
                )}
                <Badge variant="secondary">{mediaType === "movie" ? "Movie" : "TV Show"}</Badge>
              </div>
              
              <p className="mt-4 text-lg">{overview}</p>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant={isInWatchlist ? "default" : "outline"}
                  className="gap-2"
                  onClick={handleAddToWatchlist}
                >
                  <Heart className="h-4 w-4" fill={isInWatchlist ? "currentColor" : "none"} />
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </Button>
                
                <Button
                  variant={isWatched ? "default" : "outline"}
                  className="gap-2"
                  onClick={handleMarkAsWatched}
                >
                  <CheckSquare className="h-4 w-4" />
                  {isWatched ? "Watched" : "Mark as Watched"}
                </Button>
                
                <Button
                  variant={isInFavorites ? "default" : "outline"}
                  className="gap-2"
                  onClick={handleAddToFavorites}
                >
                  <Star className="h-4 w-4" fill={isInFavorites ? "currentColor" : "none"} />
                  {isInFavorites ? "In Favorites" : "Add to Favorites"}
                </Button>
                
                <Button variant="ghost" className="gap-2">
                  <ListPlus className="h-4 w-4" />
                  Add to List
                </Button>
                
                <Button variant="ghost" className="gap-2">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {mediaType === "movie" ? "Release Date" : "First Air Date"}: {releaseDate ? formatDate(releaseDate) : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">You Might Also Like</h2>
        </div>
        <MediaGrid 
          items={recommendations?.results?.slice(0, 10) || []} 
          isLoading={recommendationsLoading}
          emptyMessage="No recommendations found."
          columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
        />
      </section>
    </div>
  );
}
