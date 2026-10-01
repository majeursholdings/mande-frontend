"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { getSampleCategoryPhoto } from "@/constant/sampleDb";

/**
 * A job as a card: shared by the website's open jobs and the manufacturer
 * platform's job lists, so a job looks the same wherever it's listed: its
 * photo (or category sample fallback), the title and a line under it, a short
 * description, then the pay and how long the job runs, with a status or an
 * action beside them. The title's link is stretched over the whole card.
 */
export default function JobCard({
    href,
    title,
    meta,
    description,
    price,
    duration,
    trailing,
    imageUrl,
    category,
    fallbackImageUrl,
}: {
    href: string;
    title: string;
    /** Under the title, e.g. "Sofas · Posted today". */
    meta: string;
    description: string;
    /** What the manufacturer is paid, in naira. */
    price: number;
    /** How long the job runs, e.g. "2 months". */
    duration?: string;
    /** Beside the price — a status badge or an action. */
    trailing?: ReactNode;
    imageUrl?: string;
    category?: string;
    fallbackImageUrl?: string;
}) {
    const fallback = fallbackImageUrl || (category ? getSampleCategoryPhoto(category) : "/sample-image/table.webp");
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const displaySrc = imageUrl && imageUrl !== failedUrl ? imageUrl : fallback;

    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-colors hover:border-mist-300 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-secondary-300">
            {displaySrc && (
                <div className="relative aspect-4/3 shrink-0 bg-mist-100 overflow-hidden">
                    <Image
                        src={displaySrc}
                        alt=""
                        fill
                        unoptimized={displaySrc.startsWith("http") || displaySrc.startsWith("data:") || displaySrc.startsWith("blob:")}
                        onError={() => {
                            if (imageUrl) {
                                setFailedUrl(imageUrl);
                            }
                        }}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-4 @container">
                <div>
                    <h4 className="text-sm font-semibold font-text text-mist-950">
                        <Link href={href} className="outline-none after:absolute after:inset-0">
                            {title}
                        </Link>
                    </h4>
                    <span className="text-xs font-text text-mist-400">{meta}</span>
                </div>
                <p className="text-xs font-text text-mist-500 line-clamp-2">{description}</p>
                {/* min-h fits a badge or button, so the feet line up across cards */}
                <div className="mt-auto flex flex-col items-center @[220px]:flex-row @[220px]:items-end min-h-8 justify-between gap-2 border-t border-border pt-3">
                    <div className="flex min-w-0 flex-col gap-0.5 items-center @[220px]:items-start">
                        <span className="text-sm font-semibold font-text text-mist-950">{formatPrice(price)}</span>
                        {duration && (
                            <span className="flex items-center gap-1 text-xs font-text text-mist-500">
                                <Clock className="size-3.5 shrink-0" aria-hidden />
                                <span>
                                    <span className="sr-only">Takes </span>
                                    {duration}
                                </span>
                            </span>
                        )}
                    </div>
                    {/* Buttons sit above the stretched link and get their own clicks;
                        clicks on a badge still pass through to the card */}
                    {trailing && (
                        <div className="pointer-events-none relative z-10 shrink-0 w-full *:w-full *:justify-center @[220px]:w-auto @[220px]:*:w-auto">
                            {trailing}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
