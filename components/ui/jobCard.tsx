import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatPrice } from "@/lib/currency";

/**
 * A job as a card — shared by the website's open jobs and the manufacturer
 * platform's job lists, so a job looks the same wherever it's listed: its
 * photo (when there is one), the title and a line under it, a short
 * description, then the pay and how long the job runs, with a status or an
 * action beside them. The title's link is stretched over the whole card, so
 * the card is clickable while a button beside the price (e.g. "Apply now")
 * still works — a button can't sit inside a link.
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
}) {
    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-colors hover:border-mist-300 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-secondary-300">
            {imageUrl && (
                <div className="relative aspect-4/3 shrink-0 bg-mist-100">
                    <Image
                        src={imageUrl}
                        // The title right below says what it is
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-4">
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
                <div className="mt-auto flex min-h-8 items-end justify-between gap-2 border-t border-border pt-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
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
                        <div className="pointer-events-none relative z-10 shrink-0 [&_button]:pointer-events-auto">
                            {trailing}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
