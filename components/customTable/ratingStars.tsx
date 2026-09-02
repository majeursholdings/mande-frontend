import { Star } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// RatingStars — "AVG. RATING" star display.
// ─────────────────────────────────────────────────────────────────────────────

export function RatingStars({ value, max = 5 }: { value: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star
                    key={i}
                    className={`size-3.5 ${
                        i < Math.round(value)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                    }`}
                />
            ))}
        </div>
    );
}
