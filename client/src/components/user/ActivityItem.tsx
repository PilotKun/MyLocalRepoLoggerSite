import { getImageUrl } from "@/lib/utils";

interface ActivityItemProps {
  image?: string;
  title: string;
  description: string;
  timestamp: string | Date;
}

export default function ActivityItem({ 
  image, 
  title, 
  description, 
  timestamp 
}: ActivityItemProps) {
  const posterBasePath = "https://image.tmdb.org/t/p/w500";
  const fallbackPoster = "/fallback-poster.png";

  const imgSrc = image ? `${posterBasePath}${image}` : fallbackPoster;

  const formatDate = (dateInput: string | Date): string => {
    if (typeof dateInput === 'string') {
      return dateInput;
    }
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return dateInput.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return "Invalid date";
  };

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <img 
        src={imgSrc}
        alt={title} 
        className="h-16 w-12 rounded-md object-cover" 
      />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatDate(timestamp)}
        </time>
      </div>
    </div>
  );
}
