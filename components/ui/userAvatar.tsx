"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** A generated placeholder avatar — the same name always gets the same face. */
function dicebearUrl(seed: string): string {
    return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
}

export default function UserAvatar({
    name,
    src,
    className,
}: {
    name: string;
    /** Photo URL. Without one (or if it fails to load), a DiceBear avatar shows instead. */
    src?: string | null;
    className?: string;
}) {
    // Tried in order — the photo, then the DiceBear placeholder. Initials only
    // show once every image has failed to load (e.g. offline).
    const [failedUrls, setFailedUrls] = useState<string[]>([]);
    const imageUrl = [src, name ? dicebearUrl(name) : null].find(
        (url): url is string => !!url && !failedUrls.includes(url),
    );

    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");

    return (
        <span
            className={cn(
                "relative flex items-center justify-center shrink-0 overflow-hidden rounded-full bg-primary-100 font-medium font-text text-primary-700",
                className,
            )}
        >
            {imageUrl ? (
                <Image
                    key={imageUrl}
                    src={imageUrl}
                    alt={name}
                    fill
                    // Served as-is: DiceBear SVGs and local blob previews
                    // don't go through the image optimizer
                    unoptimized
                    onError={() => setFailedUrls((failed) => [...failed, imageUrl])}
                    className="object-cover"
                />
            ) : (
                initials || <UserRound className="size-1/2" strokeWidth={1.75} aria-hidden />
            )}
        </span>
    );
}
