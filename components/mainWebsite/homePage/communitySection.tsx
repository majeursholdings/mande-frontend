import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommunityChannel } from "@/constant/community";
import { COMMUNITY_URL } from "@/constant/navigation";
import { getWebsiteCommunity } from "@/lib/services/websiteService";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { ChannelLinkCard } from "../common/communityChannels";

/** Channels shown in the band; the Community page has them all. */
const BAND_CHANNELS = 3;

/**
 * A compact community band: MANDE's social channels (as set up in Super
 * Admin › Settings › Community) and the way to the Community page. With no
 * channels set up, just a short line and that link.
 */
export default function CommunitySection() {
    return (
        <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-12">
                <div className="flex max-w-150 flex-col gap-3">
                    <span className="text-lg font-medium">Community</span>
                    <SectionHeading as="h2">Grow with other makers.</SectionHeading>
                    <p className="text-base font-light text-mist-700">
                        Hear about new jobs first, swap tips and see what other furniture makers are building.
                    </p>
                </div>
                <VisitCommunityLink />
            </div>
            <Suspense fallback={<ChannelsSkeleton />}>
                <Channels />
            </Suspense>
        </SectionWrapper>
    );
}

function VisitCommunityLink() {
    return (
        <Link
            href={COMMUNITY_URL}
            className="group inline-flex w-fit shrink-0 items-center gap-1.5 text-base font-medium text-primary-800 hover:text-primary-950"
        >
            Visit the community
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
    );
}

async function Channels() {
    const community = await getWebsiteCommunity();
    // The featured channel (WhatsApp unless another is marked) first, then the rest
    const channels = [community?.featuredChannel, ...(community?.channels ?? [])].filter(
        (channel): channel is CommunityChannel => !!channel?.url,
    );

    if (channels.length === 0) {
        return (
            <p className="text-base font-light text-mist-700">
                Our social channels are being set up. The community page has the latest.
            </p>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {channels.slice(0, BAND_CHANNELS).map((channel) => (
                <li key={channel.platform}>
                    <ChannelLinkCard channel={channel} compact />
                </li>
            ))}
        </ul>
    );
}

function ChannelsSkeleton() {
    return (
        <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-4 rounded-[10px] border border-border bg-white p-5">
                    <div className="flex items-center gap-4">
                        <Skeleton className="size-11 rounded-full" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            ))}
        </div>
    );
}
