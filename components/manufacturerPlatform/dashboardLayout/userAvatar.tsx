import { cn } from "@/lib/utils";

export default function UserAvatar({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");

    return (
        <span
            className={cn(
                "flex items-center justify-center shrink-0 rounded-full bg-primary-100 font-medium font-text text-primary-700",
                className,
            )}
        >
            {initials}
        </span>
    );
}
