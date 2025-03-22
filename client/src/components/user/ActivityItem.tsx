import { formatRelativeTime, getImageUrl } from "@/lib/utils";

interface ActivityItemProps {
  image: string;
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
  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <img 
        src={getImageUrl(image)}
        alt={title} 
        className="h-16 w-12 rounded-md object-cover" 
      />
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatRelativeTime(timestamp)}
        </time>
      </div>
    </div>
  );
}
