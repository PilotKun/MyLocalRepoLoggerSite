import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Globe,
  Search,
  Heart,
  Film,
  Tv,
  List,
  Star,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  sidebarOpen: boolean;
}

export default function Sidebar({ className, sidebarOpen }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-background pt-16 transition-all duration-300 ease-in-out md:flex",
        sidebarOpen ? "w-64" : "w-20",
        className
      )}
    >
      <div className={cn("flex flex-1 flex-col gap-4 p-4")}>
        <div className="flex flex-col gap-1">
          <h2 className={cn("px-4 text-lg font-semibold tracking-tight", !sidebarOpen && "hidden")}>Navigate</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/") && "bg-accent text-accent-foreground"
              )}
            >
              <Home className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Home</span>
            </Link>
            <Link 
              href="/discover"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/discover") && "bg-accent text-accent-foreground"
              )}
            >
              <Globe className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Discover</span>
            </Link>
            <Link 
              href="/search"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/search") && "bg-accent text-accent-foreground"
              )}
            >
              <Search className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Search</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className={cn("px-4 text-lg font-semibold tracking-tight", !sidebarOpen && "hidden")}>Library</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/watchlist"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/watchlist") && "bg-accent text-accent-foreground"
              )}
            >
              <Heart className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Watchlist</span>
            </Link>
            <Link 
              href="/favorites"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/favorites") && "bg-accent text-accent-foreground"
              )}
            >
              <Star className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Favorites</span>
            </Link>
            <Link 
              href="/lists"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/lists") && "bg-accent text-accent-foreground"
              )}
            >
              <List className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>My Lists</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className={cn("px-4 text-lg font-semibold tracking-tight", !sidebarOpen && "hidden")}>Categories</h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/movies"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/movies") && "bg-accent text-accent-foreground"
              )}
            >
              <Film className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>Movies</span>
            </Link>
            <Link 
              href="/tv-shows"
              className={cn(
                "flex items-center rounded-lg py-2 text-foreground/70 transition-colors hover:text-foreground",
                sidebarOpen ? "gap-3 px-4" : "justify-center px-2",
                isActive("/tv-shows") && "bg-accent text-accent-foreground"
              )}
            >
              <Tv className="h-4 w-4" />
              <span className={cn(!sidebarOpen && "hidden")}>TV Shows</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
