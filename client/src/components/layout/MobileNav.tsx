import { Link, useLocation } from "wouter";
import { Home, Globe, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <nav className="flex">
        <Link 
          href="/"
          className="flex flex-1 flex-col items-center justify-center py-3"
        >
          <Home
            className={cn(
              "h-5 w-5",
              isActive("/") ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="mt-1 text-xs">Home</span>
        </Link>
        <Link 
          href="/discover"
          className="flex flex-1 flex-col items-center justify-center py-3"
        >
          <Globe
            className={cn(
              "h-5 w-5",
              isActive("/discover") ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="mt-1 text-xs">Discover</span>
        </Link>
        <Link 
          href="/search"
          className="flex flex-1 flex-col items-center justify-center py-3"
        >
          <Search
            className={cn(
              "h-5 w-5",
              isActive("/search") ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="mt-1 text-xs">Search</span>
        </Link>
        <Link 
          href="/profile"
          className="flex flex-1 flex-col items-center justify-center py-3"
        >
          <User
            className={cn(
              "h-5 w-5",
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="mt-1 text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
