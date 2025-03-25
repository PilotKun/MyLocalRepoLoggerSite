import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  className?: string;
}

export default function Rating({ value, onChange, readonly = false, className }: RatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const displayValue = hoveredValue ?? value;

  const ratingValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  if (readonly) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Star className="h-4 w-4 fill-primary text-primary" />
        <span className="text-sm font-medium">{value}/10</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-1 px-2", className)}
        >
          <Star
            className={cn(
              "h-4 w-4",
              value ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
          <span className="text-sm font-medium">
            {value ? `${value}/10` : "Rate"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="grid grid-cols-5 gap-1 p-2">
          {ratingValues.map((rating) => (
            <Button
              key={rating}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                (hoveredValue !== null
                  ? rating <= hoveredValue
                  : rating <= (value || 0)) && "bg-primary/10 text-primary"
              )}
              onMouseEnter={() => setHoveredValue(rating)}
              onMouseLeave={() => setHoveredValue(null)}
              onClick={() => onChange?.(rating)}
            >
              {rating}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 