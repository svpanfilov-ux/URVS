import { cn } from "@/lib/utils";

interface QualityRatingProps {
  score: number;
  onChange: (score: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function QualityRating({ score, onChange, size = "md", disabled = false }: QualityRatingProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  const circleClass = sizeClasses[size];

  return (
    <div className="flex justify-center space-x-1 mt-1" data-testid="quality-rating">
      {[1, 2, 3, 4].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(rating)}
          data-testid={`quality-${rating}`}
          className={cn(
            circleClass,
            "rounded-full transition-colors",
            rating <= score 
              ? "bg-green-600" 
              : "bg-gray-300 dark:bg-gray-600",
            !disabled && "hover:bg-green-500 cursor-pointer"
          )}
          title={`Оценка ${rating} из 4`}
        />
      ))}
    </div>
  );
}
