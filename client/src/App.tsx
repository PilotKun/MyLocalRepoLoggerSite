import { useState } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import { AuthProvider } from '@/components/auth/AuthContext';

// Pages
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Search from "@/pages/search";
import Movies from "@/pages/movies";
import TVShows from "@/pages/tv-shows";
import Watchlist from "@/pages/watchlist";
import Favorites from "@/pages/favorites";
import Lists from "@/pages/lists";
import Profile from "@/pages/profile";
import MediaDetail from "@/pages/media/[id]";
import NotFound from "@/pages/not-found";
import ListDetail from "@/pages/lists/[id]";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar sidebarOpen={sidebarOpen} />
        <main className={`flex-1 pt-16 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'} transition-all duration-300 ease-in-out`}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/discover" component={Discover} />
            <Route path="/search" component={Search} />
            <Route path="/movies" component={Movies} />
            <Route path="/tv-shows" component={TVShows} />
            <Route path="/watchlist" component={Watchlist} />
            <Route path="/favorites" component={Favorites} />
            <Route path="/lists" component={Lists} />
            <Route path="/lists/:id" component={ListDetail} />
            <Route path="/profile" component={Profile} />
            <Route path="/media/:id" component={MediaDetail} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Remove the MyApp component since this is not a Next.js app
// and it's not being used

export default App;