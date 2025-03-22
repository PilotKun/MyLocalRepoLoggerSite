import { Link, useLocation } from "wouter";
import { Home, Globe, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
      <nav className="flex">
        <Link href="/">
          <a className="flex flex-1 flex-col items-center justify-center py-3">
            <Home
              className={cn(
                "h-5 w-5",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="mt-1 text-xs">Home</span>
          </a>
        </Link>
        <Link href="/discover">
          <a className="flex flex-1 flex-col items-center justify-center py-3">
            <Globe
              className={cn(
                "h-5 w-5",
                isActive("/discover") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="mt-1 text-xs">Discover</span>
          </a>
        </Link>
        <Link href="/search">
          <a className="flex flex-1 flex-col items-center justify-center py-3">
            <Search
              className={cn(
                "h-5 w-5",
                isActive("/search") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="mt-1 text-xs">Search</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className="flex flex-1 flex-col items-center justify-center py-3">
            <User
              className={cn(
                "h-5 w-5",
                isActive("/profile") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="mt-1 text-xs">Profile</span>
          </a>
        </Link>
      </nav>
    </div>
  );
}
