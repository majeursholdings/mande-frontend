import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** A review's stars, read out as "4 out of 5 stars". */
export default function ReviewStars({ rating, className }: { rating: number; className?: string }) {
    return (
        <span className={cn("flex", className)} role="img" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={cn("size-3.5", index < rating ? "fill-warning-400 text-warning-400" : "text-mist-300")} aria-hidden />
            ))}
        </span>
    );
}
