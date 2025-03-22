import { useState } from "react";
import { Link } from "wouter";
import { TMDBMovie, TMDBTVShow } from "@shared/schema";
import { getImageUrl } from "@/lib/utils";

interface MediaCardProps {
  media: TMDBMovie | TMDBTVShow;
  aspectRatio?: "portrait" | "video" | "square";
  width?: number;
  height?: number;
}

export default function MediaCard({
  media,
  aspectRatio = "portrait",
  width,
  height,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isMovie = "title" in media;
  const title = isMovie ? media.title : media.name;
  const releaseDate = isMovie ? media.release_date : media.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const rating = media.vote_average.toFixed(1);
  
  const aspectRatioClass = 
    aspectRatio === "portrait" ? "aspect-[2/3]" :
    aspectRatio === "video" ? "aspect-video" :
    "aspect-square";

  return (
    <Link 
      href={`/media/${media.id}?type=${isMovie ? 'movie' : 'tv'}`}
      className="group relative overflow-hidden rounded-lg border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={getImageUrl(media.poster_path)}
        alt={title}
        className={`${aspectRatioClass} w-full object-cover transition-all group-hover:scale-105`}
        width={width}
        height={height}
        loading="lazy"
      />
      {/* Gradient overlay - always visible at bottom, full on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-100 transition-opacity"></div>
      
      {/* Title and year - always visible */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
        <p className="text-xs text-white/70">{year}</p>
      </div>
      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 text-white backdrop-blur-sm">
        <span className="text-xs font-medium">{rating}</span>
      </div>
    </Link>
  );
}
