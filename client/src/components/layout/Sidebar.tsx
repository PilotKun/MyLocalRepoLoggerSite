import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Globe,
  Search,
  Heart,
  Apple,
  Film,
  Tv,
  List,
  Star
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background pt-16 md:flex",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="px-4 text-lg font-semibold tracking-tight">Navigate</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/") && "bg-accent text-accent-foreground"
              )}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link 
              href="/discover"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/discover") && "bg-accent text-accent-foreground"
              )}
            >
              <Globe className="h-4 w-4" />
              Discover
            </Link>
            <Link 
              href="/search"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/search") && "bg-accent text-accent-foreground"
              )}
            >
              <Search className="h-4 w-4" />
              Search
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="px-4 text-lg font-semibold tracking-tight">Library</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/watchlist"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/watchlist") && "bg-accent text-accent-foreground"
              )}
            >
              <Heart className="h-4 w-4" />
              Watchlist
            </Link>
            <Link 
              href="/watched"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/watched") && "bg-accent text-accent-foreground"
              )}
            >
              <Apple className="h-4 w-4" />
              Watched
            </Link>
            <Link 
              href="/favorites"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/favorites") && "bg-accent text-accent-foreground"
              )}
            >
              <Star className="h-4 w-4" />
              Favorites
            </Link>
            <Link 
              href="/lists"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/lists") && "bg-accent text-accent-foreground"
              )}
            >
              <List className="h-4 w-4" />
              My Lists
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="px-4 text-lg font-semibold tracking-tight">Categories</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/movies"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/movies") && "bg-accent text-accent-foreground"
              )}
            >
              <Film className="h-4 w-4" />
              Movies
            </Link>
            <Link 
              href="/tv-shows"
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-foreground/70 transition-colors hover:text-foreground",
                isActive("/tv-shows") && "bg-accent text-accent-foreground"
              )}
            >
              <Tv className="h-4 w-4" />
              TV Shows
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
