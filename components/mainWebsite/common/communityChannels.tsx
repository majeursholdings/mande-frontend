import Link from "next/link";
import { ArrowRight, ArrowUpRight, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityChannel, CommunityPlatform } from "@/constant/community";
import { CONTACT_URL } from "@/constant/navigation";
import HoverCard from "./hoverCard";
import { PLATFORMS } from "@/components/manufacturerPlatform/communityPage/platforms";

// ─────────────────────────────────────────────────────────────────────────────
// MANDE's social channels on the website (the Community page and the
// homepage's community band). Only channels set up in Super Admin › Settings ›
// Community with a link reach here: the API drops the rest. Each card is one
// link out to the channel, opened in a new tab.
// ─────────────────────────────────────────────────────────────────────────────

/** Platforms where people join a group rather than follow an account. */
const JOIN_PLATFORMS: CommunityPlatform[] = ["whatsapp", "telegram", "facebook"];

/** The channel's call to action as set in Settings, or "Join" / "Follow" by platform. */
function channelCta(channel: CommunityChannel) {
    return channel.cta?.trim() || (JOIN_PLATFORMS.includes(channel.platform) ? "Join" : "Follow");
}

function platformOf(channel: CommunityChannel) {
    return PLATFORMS[channel.platform] ?? PLATFORMS.whatsapp;
}

/**
 * A channel as a card: the platform's mark, its name and handle, what's
 * posted there, its audience, and the call to action. `compact` tightens it
 * for the homepage band.
 */
export function ChannelLinkCard({ channel, compact = false }: { channel: CommunityChannel; compact?: boolean }) {
    const { name, Icon, badgeClass } = platformOf(channel);
    const audience = channel.audience || channel.followerCountFormatted;
    const handle = channel.handle?.trim();
    const description = channel.description?.trim();
    const cta = channelCta(channel);

    return (
        <HoverCard className="h-full rounded-[10px]">
            <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${cta}: MANDE on ${name}${handle ? ` (${handle})` : ""}, opens in a new tab`}
                className={cn(
                    "group flex h-full flex-col rounded-[10px] border border-border bg-white transition-colors duration-300 hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800",
                    compact ? "gap-4 p-5" : "gap-5 p-6 lg:p-8",
                )}
            >
                <div className="flex items-start gap-4">
                    <span
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full text-white",
                            compact ? "size-11" : "size-12",
                            badgeClass,
                        )}
                    >
                        <Icon className={compact ? "size-5" : "size-6"} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-lg font-medium text-mist-950">{name}</p>
                        {handle && <p className="truncate text-sm font-light text-mist-600">{handle}</p>}
                    </div>
                    <ArrowUpRight
                        className="size-5 shrink-0 text-mist-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-800"
                        aria-hidden
                    />
                </div>

                {description && (
                    <p className={cn("text-base font-light text-mist-700", compact && "line-clamp-2")}>{description}</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="min-w-0 truncate text-sm font-light text-mist-600">{audience}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-800 group-hover:text-primary-950">
                        {cta}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                    </span>
                </div>
            </a>
        </HoverCard>
    );
}

/**
 * The featured channel (the WhatsApp channel unless another is marked as
 * featured): a dark panel with the channel's handle, what's posted there and
 * a button out to it. WhatsApp keeps its own green; the rest use the site's.
 */
export function FeaturedChannelCard({ channel }: { channel: CommunityChannel }) {
    const { name, Icon, badgeClass } = platformOf(channel);
    const audience = channel.audience || channel.followerCountFormatted;
    const handle = channel.handle?.trim();
    const description = channel.description?.trim();
    const cta = channelCta(channel);
    const isWhatsApp = channel.platform === "whatsapp";

    return (
        <section
            aria-label={`MANDE on ${name}`}
            className={cn(
                "relative isolate overflow-hidden rounded-[10px] p-6 text-white md:p-10",
                isWhatsApp ? "bg-[#075E54]" : "bg-primary-950",
            )}
        >
            <Icon className="absolute -right-8 -bottom-10 -z-10 size-48 text-white/10 md:size-64" />
            <div className="flex max-w-xl flex-col gap-5">
                <span className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/85">
                    <span className={cn("flex size-10 items-center justify-center rounded-full", badgeClass)}>
                        <Icon className="size-5 text-white" />
                    </span>
                    {name}
                    {audience && <span className="font-light text-white/70">{audience}</span>}
                </span>
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl tracking-tight wrap-anywhere md:text-3xl">{handle || `MANDE on ${name}`}</h2>
                    {description && <p className="text-base font-light text-white/85">{description}</p>}
                </div>
                <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-button border border-white bg-white px-5 py-1.5 text-base font-medium text-primary-950 transition-colors duration-300 hover:border-primary-200 hover:bg-primary-200"
                >
                    {cta} on {name}
                    <ArrowUpRight className="size-4" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                </a>
            </div>
        </section>
    );
}

/** What shows while no channels are set up: a calm note and the way to the contact page, never stand-in links. */
export function NoChannelsYet({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-[10px] border border-dashed border-mist-300 bg-white p-6 sm:flex-row sm:items-center md:p-8",
                className,
            )}
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                <UsersRound className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
                <p className="text-lg font-medium">Our channels are being set up.</p>
                <p className="text-base font-light text-mist-700">
                    In the meantime,{" "}
                    <Link href={CONTACT_URL} className="font-medium text-primary-800 underline-offset-4 hover:underline">
                        contact us
                    </Link>{" "}
                    and we&apos;ll get back to you by email.
                </p>
            </div>
        </div>
    );
}
