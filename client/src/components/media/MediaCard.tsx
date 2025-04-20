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
  const isMovie = "title" in media;
  const title = isMovie ? media.title : media.name;
  const releaseDate = isMovie ? media.release_date : media.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const rating = media.vote_average ? media.vote_average.toFixed(1) : "N/A";
  
  return (
    <div className="flex flex-col overflow-hidden rounded-md border shadow-sm transition-all hover:shadow-md">
      <Link 
        href={`/media/${media.id}?type=${isMovie ? 'movie' : 'tv'}`}
        className="relative block"
      >
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={getImageUrl(media.poster_path)}
            alt={title}
            className="h-full w-full object-cover"
            width={width || 200}
            height={height || 300}
            loading="lazy"
          />
          {/* Rating Badge - Conditionally render only if vote_average > 0 */}
          {media.vote_average && media.vote_average > 0 && (
            <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-semibold text-white">
              {media.vote_average.toFixed(1)} 
            </div>
          )}
        </div>
        
        {/* Title and Year */}
        <div className="p-2">
          <h3 className="text-sm font-medium line-clamp-1" title={title}>{title}</h3>
          {year && <p className="text-xs text-muted-foreground">{year}</p>}
        </div>
      </Link>
    </div>
  );
}
