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
import MediaGrid from "@/components/media/MediaGrid";
import StatsCard from "@/components/user/StatsCard";
import ActivityItem from "@/components/user/ActivityItem";
import { TMDBMovie, TMDBTVShow } from "@shared/schema";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Mock user stats - these would come from the API in a real application
  const userStats = {
    moviesWatched: 86,
    tvEpisodesWatched: 254,
    averageRating: 7.4,
    totalWatchtime: 428
  };

  // Mock activity - this would come from the API in a real application
  const recentActivity = [
    {
      id: 1,
      image: "/vBZ0qvaRxqEhZwl6LWmruJqWE8Z.jpg",
      title: "You rated Dune: Part Two",
      description: "You gave it 9/10",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      image: "/bMUGhsGZ6ZPVWm0gGGvmrThBCmF.jpg",
      title: "You watched Fallout S01E04",
      description: "Added to your watch history",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 3,
      image: "/cG5QZsiWrk9s2WmQrZoRCBTVjPL.jpg",
      title: "You added Challengers to watchlist",
      description: "Added to your watchlist",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      {/* Hero Section */}
      <section className="relative mb-8 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20"></div>
        <div className="relative flex flex-col gap-2 p-6 md:p-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome to CineLog</h1>
          <p className="max-w-[600px] text-lg text-muted-foreground">
            Track, discover, and share your favorite movies and TV shows.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button>Get Started</Button>
            <Button variant="outline">Explore</Button>
          </div>
        </div>
      </section>

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

      {isAuthenticated && (
        <>
          {/* User Stats Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Your Stats</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Movies Watched"
                value={userStats.moviesWatched}
                subtitle="+12 this month"
                icon={FileText}
              />
              <StatsCard
                title="TV Episodes"
                value={userStats.tvEpisodesWatched}
                subtitle="+38 this month"
                icon={CheckSquare}
              />
              <StatsCard
                title="Average Rating"
                value={userStats.averageRating}
                subtitle="From 124 ratings"
                icon={Star}
              />
              <StatsCard
                title="Hours Watched"
                value={userStats.totalWatchtime}
                subtitle="+26 this month"
                icon={Clock}
              />
            </div>
          </section>

          {/* Activity Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <div className="mt-4 space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  image={activity.image}
                  title={activity.title}
                  description={activity.description}
                  timestamp={activity.timestamp}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
