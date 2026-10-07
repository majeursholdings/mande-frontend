"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
    COMMUNITY_CHANNELS,
    COMMUNITY_TESTIMONIALS,
    FEATURED_COMMUNITY_CHANNEL,
    type CommunityChannel,
    type CommunityTestimonial,
} from "@/constant/community";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import UserAvatar from "@/components/ui/userAvatar";
import PageHeader from "../pageHeader";
import { PLATFORMS } from "./platforms";

type CommunityResponse = {
    featuredChannel?: CommunityChannel;
    channels?: CommunityChannel[];
    testimonials?: CommunityTestimonial[];
};

export default function ManufacturerCommunityPage() {
    const { data } = useQuery<CommunityResponse>({
        queryKey: ["community-public"],
        queryFn: async () => {
            const res = await api.get<CommunityResponse>("/community");
            return res.data;
        },
        staleTime: 60_000,
    });

    const featuredChannel = data?.featuredChannel ?? FEATURED_COMMUNITY_CHANNEL;
    const channels = data?.channels && data.channels.length > 0 ? data.channels : COMMUNITY_CHANNELS;
    const testimonials = data?.testimonials && data.testimonials.length > 0 ? data.testimonials : COMMUNITY_TESTIMONIALS;

    return (
        <div className="flex flex-col gap-10">
            <PageHeader
                title="Our community"
                description="Connect with other makers, pick up tips, and hear about new jobs first."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <FeaturedChannel channel={featuredChannel} />

            <section className="flex flex-col gap-4">
                <h2 className="text-base font-semibold font-text text-mist-950">Follow us</h2>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {channels.map((channel) => (
                        <li key={channel.platform}>
                            <ChannelCard channel={channel} />
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold font-text text-mist-950">
                        What makers are saying
                    </h2>
                    <p className="text-sm font-text text-mist-600">
                        Stories and feedback from fellow makers on Mande and our social channels.
                    </p>
                </div>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <li key={testimonial.id}>
                            <TestimonialCard testimonial={testimonial} />
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

/** A link that opens the platform in a new tab. */
function ExternalLink({
    href,
    className,
    children,
}: {
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
        </a>
    );
}

// The WhatsApp channel gets the big card — it's where new jobs are announced first
export function FeaturedChannel({ channel }: { channel: CommunityChannel }) {
    const platformConfig = PLATFORMS[channel.platform] ?? PLATFORMS.whatsapp;
    const { name, Icon } = platformConfig;
    const audienceStr = channel.audience || channel.followerCountFormatted;

    return (
        <section className="relative isolate overflow-hidden rounded-2xl bg-[#075E54] p-6 text-white sm:p-8">
            <Icon className="absolute -right-6 -bottom-8 -z-10 size-44 text-white/10" />
            <div className="flex max-w-xl flex-col gap-4">
                <span className="flex items-center gap-2 text-xs font-semibold font-text uppercase tracking-wide text-white/80">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366]">
                        <Icon className="size-4.5 text-white" />
                    </span>
                    {name} channel {audienceStr ? `· ${audienceStr}` : ""}
                </span>
                <div className="flex flex-col gap-2">
                    <h2 className="text-xl font-semibold font-text sm:text-2xl">{channel.handle}</h2>
                    <p className="text-sm leading-6 font-text text-white/85">{channel.description}</p>
                </div>
                <ExternalLink
                    href={channel.href}
                    className="inline-flex h-11 w-fit items-center gap-2 rounded-button bg-white px-5 text-sm font-semibold font-text text-[#075E54] transition-colors hover:bg-white/90"
                >
                    {channel.cta}
                </ExternalLink>
            </div>
        </section>
    );
}

export function ChannelCard({ channel }: { channel: CommunityChannel }) {
    const platformConfig = PLATFORMS[channel.platform] ?? PLATFORMS.whatsapp;
    const { name, Icon, badgeClass, accentClass } = platformConfig;
    const audienceStr = channel.audience || channel.followerCountFormatted;

    return (
        <div className="flex h-full flex-col gap-4 rounded-xl border border-border bg-white p-5 transition-shadow duration-200 hover:shadow-md">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl text-white",
                        badgeClass,
                    )}
                >
                    <Icon className="size-5.5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold font-text text-mist-950">{name}</p>
                    <p className="truncate text-xs font-text text-mist-500">{channel.handle}</p>
                </div>
            </div>
            <p className="flex-1 text-sm leading-6 font-text text-mist-600">{channel.description}</p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                {audienceStr ? (
                    <span className="text-xs font-medium font-text text-mist-500">{audienceStr}</span>
                ) : (
                    <span />
                )}
                <ExternalLink
                    href={channel.href}
                    className={cn(
                        "inline-flex items-center gap-1 text-sm font-semibold font-text hover:underline",
                        accentClass,
                    )}
                >
                    {channel.cta}
                </ExternalLink>
            </div>
        </div>
    );
}

export function TestimonialCard({ testimonial }: { testimonial: CommunityTestimonial }) {
    const platformConfig = PLATFORMS[testimonial.platform] ?? PLATFORMS.mande;
    const { name, Icon, badgeClass } = platformConfig;
    const isMande = testimonial.platform === "mande";
    const ratingCount = testimonial.rating ?? 5;

    return (
        <figure className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-white p-5 transition-shadow duration-200 hover:shadow-md">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-amber-500" aria-label={`${ratingCount} out of 5 stars`}>
                        {Array.from({ length: ratingCount }).map((_, i) => (
                            <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium font-text text-mist-500">
                        <span
                            className={cn(
                                "flex size-5 items-center justify-center rounded-full text-white",
                                badgeClass,
                            )}
                        >
                            <Icon className="size-3" />
                        </span>
                        {isMande ? "Verified Maker" : `on ${name}`}
                    </span>
                </div>
                <blockquote className="text-sm leading-6 font-text text-mist-800">
                    &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <figcaption className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={testimonial.name} src={testimonial.avatarUrl ?? undefined} className="size-9 text-xs shrink-0" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium font-text text-mist-950 truncate">{testimonial.name}</p>
                            {testimonial.verifiedMaker && (
                                <span className="inline-flex items-center text-[10px] font-semibold font-text text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    Verified
                                </span>
                            )}
                        </div>
                        <p className="truncate text-xs font-text text-mist-500">{testimonial.business}</p>
                    </div>
                </figcaption>
                {testimonial.sourceUrl && (
                    <a
                        href={testimonial.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-mist-400 hover:text-mist-700 shrink-0"
                        title="View original"
                    >
                        <ArrowUpRight className="size-4" />
                    </a>
                )}
            </div>
        </figure>
    );
}
