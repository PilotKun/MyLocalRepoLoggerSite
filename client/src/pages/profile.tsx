import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Settings, FileText, CheckSquare, Star, Clock } from "lucide-react";
import StatsCard from "@/components/user/StatsCard";
import ActivityItem from "@/components/user/ActivityItem";
import MediaGrid from "@/components/media/MediaGrid";
import { useAuth } from "@/components/auth/AuthContext";
import EditProfileModal from "@/components/user/EditProfileModal";
import { formatRuntime } from "@/lib/utils";

export default function Profile() {
  const { currentUser, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "lists" | "stats">("overview");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Fetch user profile
  const { data: user } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}`);
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: !!currentUser,
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/stats`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/stats`);
        return await response.json();
      } catch (error) {
        return {
          moviesWatched: 0,
          tvShowsWatched: 0,
          averageRating: 0,
          totalWatchtime: 0
        };
      }
    },
    enabled: !!currentUser,
  });

  // Fetch recent activity
  const { data: activity } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/activity`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/activity`);
        return await response.json();
      } catch (error) {
        // Return empty array if not authenticated
        return [];
      }
    },
  });

  // Fetch watched items
  const { data: watched, isLoading: watchedLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/watched`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/watched`);
        return await response.json();
      } catch (error) {
        // Return empty array if not authenticated
        return [];
      }
    },
    enabled: !!currentUser,
  });

  // Fetch user's lists
  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: [`/api/users/${currentUser?.uid}/lists`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/users/${currentUser?.uid}/lists`);
        return await response.json();
      } catch (error) {
        // Return empty array if not authenticated
        return [];
      }
    },
    enabled: activeTab === "lists",
  });

  if (!currentUser) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center md:px-6">
        <h1 className="mb-4 text-3xl font-bold">Your Profile</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sign in to view and manage your profile, track your watch history, and see your stats.
        </p>
        <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
      </div>
    );
  }

  // Use the fetched user data, expecting displayName and photoURL
  const userDisplayName = user?.displayName || "User";
  const userPhotoURL = user?.photoURL;
  const userEmail = user?.email || currentUser?.email || "user@example.com"; // Get email from fetched data or context

  // Add console log to check the photo URL value
  console.log("User Photo URL from fetched data:", userPhotoURL);

  return (
    <div className="container px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted">
          {userPhotoURL ? (
            <img 
              src={userPhotoURL} 
              alt={userDisplayName} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <span className="text-4xl font-bold text-muted-foreground">
              {userDisplayName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{userDisplayName}</h1>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => setShowEditProfileModal(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5"
            onClick={logOut}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Your Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Movies Watched"
                  value={stats?.moviesWatched || 0}
                  icon={FileText}
                />
                <StatsCard
                  title="TV/Series"
                  value={stats?.tvShowsWatched || 0}
                  icon={CheckSquare}
                />
                <StatsCard
                  title="Average Rating"
                  value={stats?.averageRating?.toFixed(1) || "0.0"}
                  icon={Star}
                />
                <StatsCard
                  title="Hours Watched"
                  value={stats?.totalWatchtime || 0}
                  icon={Clock}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
              <div className="space-y-4">
                {activity && activity.length > 0 ? (
                  activity.slice(0, 3).map((item: any, index: number) => (
                    <ActivityItem
                      key={index}
                      image={item.media?.posterPath || ""}
                      title={
                        item.type === "watched"
                          ? `You watched ${item.media?.title}`
                          : item.type === "watchlist"
                          ? `You added ${item.media?.title} to watchlist`
                          : `You favorited ${item.media?.title}`
                      }
                      description={
                        item.type === "watched" && item.rating
                          ? `You rated it ${item.rating}/10`
                          : `Added to your ${item.type}`
                      }
                      timestamp={item.date || item.addedAt || item.watchedAt}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No recent activity.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Recently Watched</h2>
            <MediaGrid
              items={watched?.slice(0, 6).map((item: any) => ({
                ...item.media,
                // Ensure poster_path is mapped from potential posterPath
                poster_path: item.media?.posterPath || item.media?.poster_path
              })) || []}
              isLoading={watchedLoading}
              emptyMessage="You haven't watched anything yet."
            />
          </div>
        </TabsContent>

        <TabsContent value="lists">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Your Lists</h2>
              <Button variant="outline">Create New List</Button>
            </div>
            
            {lists && lists.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lists.map((list: any) => (
                  <div key={list.id} className="rounded-lg border p-4">
                    <h3 className="text-lg font-semibold">{list.name}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {list.description || "No description"}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm">View List</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">You don't have any lists yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">Your Stats</h2>
            
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="Movies Watched"
                value={stats?.moviesWatched || 0}
                subtitle={`${stats?.moviesWatchedThisMonth || 0} this month`}
                icon={FileText}
              />
              <StatsCard
                title="TV Shows Watched"
                value={stats?.tvShowsWatched || 0}
                subtitle={`${stats?.tvShowsWatchedThisMonth || 0} this month`}
                icon={CheckSquare}
              />
              <StatsCard
                title="Average Rating"
                value={stats?.averageRating?.toFixed(1) || "0.0"}
                subtitle={`From ${Math.round((stats?.moviesWatched || 0) + (stats?.tvShowsWatched || 0))} ratings`}
                icon={Star}
              />
              <StatsCard
                title="Total Watchtime"
                value={formatRuntime(stats?.totalWatchtime || 0)}
                subtitle="Hours & Minutes"
                icon={Clock}
              />
            </div>
            
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-xl font-semibold">Watch Statistics</h3>
              <p className="text-center text-muted-foreground">
                Detailed stats will appear here as you track more movies and shows.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showEditProfileModal && <EditProfileModal onClose={() => setShowEditProfileModal(false)} />}
    </div>
  );
}
