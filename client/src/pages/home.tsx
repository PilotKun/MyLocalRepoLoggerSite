import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  FileText, 
  CheckSquare, 
  Star,
  Clock 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getTrending, getPopularTVShows } from "@/lib/tmdb";
import { apiRequest } from "@/lib/queryClient";
import MediaGrid from "@/components/media/MediaGrid";
import StatsCard from "@/components/user/StatsCard";
import { TMDBMovie, TMDBTVShow } from "@shared/schema";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthContext";

// Interface for user statistics
interface UserStatsData {
  moviesWatched: number;
  tvShowsWatched: number;
  averageRating: number;
  totalWatchtime: number; // Assuming this is in hours or a unit that makes sense
  // Add other stats fields if necessary, e.g., ratingsCount for averageRating subtitle
  ratingsCount?: number; 
}

export default function Home() {
  const { currentUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Trending movies and shows
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['/trending/all/week'],
    queryFn: () => getTrending(),
  });

  // Popular TV shows
  const { data: popularTVData, isLoading: tvLoading } = useQuery({
    queryKey: ['/tv/popular'],
    queryFn: () => getPopularTVShows(),
  });

  // Fetch user statistics
  const { 
    data: userStats, 
    isLoading: statsLoading, 
    isError: statsError 
  } = useQuery<UserStatsData>({
    queryKey: [`/api/users/${currentUser?.uid}/stats`, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null; // Or throw an error, or return a default stats object
      const response = await apiRequest("GET", `/api/users/${currentUser.uid}/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }
      return response.json();
    },
    enabled: !!currentUser, // Only run query if user is logged in
  });

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      {/* Hero Section - Conditionally render if user is NOT logged in */}
      {!currentUser && (
        <section className="relative mb-8 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20"></div>
          <div className="relative flex flex-col gap-2 p-6 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome to CineLog</h1>
            <p className="max-w-[600px] text-lg text-muted-foreground">
              Track, discover, and share your favorite movies and TV shows.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setShowAuthModal(true)}>Get Started</Button>
              <Link href="/discover">
                <Button variant="outline">Explore</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Trending</h2>
          <Link href="/trending" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <MediaGrid 
          items={trendingData?.results.slice(0, 18) || []} 
          isLoading={trendingLoading}
        />
      </section>

      {/* Popular TV Shows Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Popular TV Shows</h2>
          <Link href="/tv-shows/popular" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <MediaGrid 
          items={popularTVData?.results.slice(0, 18) || []} 
          isLoading={tvLoading}
        />
      </section>

      {/* Use currentUser to conditionally render stats */}
      {currentUser && (
        <>
          {/* User Stats Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Your Stats</h2>
            {statsLoading && (
              <div className="mt-4 text-center text-muted-foreground">Loading your stats...</div>
            )}
            {statsError && (
              <div className="mt-4 text-center text-destructive">Could not load your stats. Please try again later.</div>
            )}
            {userStats && !statsLoading && !statsError && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Movies Watched"
                  value={userStats.moviesWatched}
                  subtitle="Total movies"
                  icon={FileText}
                />
                <StatsCard
                  title="TV Shows"
                  value={userStats.tvShowsWatched}
                  subtitle="Total shows"
                  icon={CheckSquare}
                />
                <StatsCard
                  title="Average Rating"
                  value={userStats.averageRating > 0 ? userStats.averageRating.toFixed(1) : 'N/A'}
                  subtitle={userStats.ratingsCount ? `From ${userStats.ratingsCount} ratings` : "No ratings yet"}
                  icon={Star}
                />
                <StatsCard
                  title="Hours Watched"
                  value={userStats.totalWatchtime}
                  subtitle="Total time"
                  icon={Clock}
                />
              </div>
            )}
          </section>
        </>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
