import Image from "next/image";
import Link from "next/link";
import {
    ChannelCard,
    FeaturedChannel,
    TestimonialCard,
} from "@/components/manufacturerPlatform/communityPage";
import {
    COMMUNITY_CHANNELS,
    COMMUNITY_TESTIMONIALS,
    FEATURED_COMMUNITY_CHANNEL,
    type CommunityChannel,
    type CommunityTestimonial,
} from "@/constant/community";
import { SERVICES_URL } from "@/constant/navigation";
import CtaBand from "../common/ctaBand";
import PageHero from "../common/pageHero";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

// ─────────────────────────────────────────────────────────────────────────────
// Community — where makers on MANDE meet: the WhatsApp channel first (new
// jobs are announced there), the other channels, what makers say, and the
// Lagos factory, where they meet in person.
// ─────────────────────────────────────────────────────────────────────────────

export interface CommunityPageProps {
    data?: {
        featuredChannel?: CommunityChannel;
        channels?: CommunityChannel[];
        testimonials?: CommunityTestimonial[];
    } | null;
}

export default function CommunityPage({ data }: CommunityPageProps = {}) {
    const featuredChannel = data?.featuredChannel ?? FEATURED_COMMUNITY_CHANNEL;
    const channels = data?.channels && data.channels.length > 0 ? data.channels : COMMUNITY_CHANNELS;
    const testimonials = data?.testimonials && data.testimonials.length > 0 ? data.testimonials : COMMUNITY_TESTIMONIALS;

    return (
        <>
            <PageHero
                eyebrow="Community"
                title="Makers who grow together."
                description="Swap tips, see what other furniture makers are building, and hear about new jobs first. Join the MANDE community on the channels you already use."
            />

            <SectionWrapper containerClassName="flex flex-col gap-10 md:gap-12">
                <FeaturedChannel channel={featuredChannel} />

                <div className="flex flex-col gap-6">
                    <SectionHeading as="h2">Follow MANDE.</SectionHeading>
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {channels.map((channel) => (
                            <li key={channel.platform}>
                                <ChannelCard channel={channel} />
                            </li>
                        ))}
                    </ul>
                </div>
            </SectionWrapper>

            <SectionWrapper className="bg-mist-200" containerClassName="flex flex-col gap-8 md:gap-12">
                <div className="flex flex-col gap-2">
                    <SectionHeading as="h2" className="max-w-175">
                        What makers are saying.
                    </SectionHeading>
                    <p className="text-base font-light text-mist-700">
                        Real experiences and reviews from makers on MANDE and our social channels.
                    </p>
                </div>
                <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {testimonials.map((testimonial) => (
                        <li key={testimonial.id}>
                            <TestimonialCard testimonial={testimonial} />
                        </li>
                    ))}
                </ul>
            </SectionWrapper>

            <SectionWrapper containerClassName="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                <div className="flex-1">
                    <Image
                        src="/images/image1.png"
                        alt="Makers working together in a workshop"
                        width={1000}
                        height={667}
                        className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                    />
                </div>
                <div className="flex flex-1 flex-col gap-4">
                    <span className="text-lg font-medium">Meet in person</span>
                    <SectionHeading as="h2">Build side by side at our Lagos factory.</SectionHeading>
                    <p className="text-base font-light">
                        Members book time on the country&apos;s top furniture machines at the MANDE factory in Lagos. It&apos;s
                        where makers trade techniques, share jobs and see how others finish their pieces.
                    </p>
                    <Link href={SERVICES_URL} className={WEBSITE_PRIMARY_BUTTON}>
                        See our services
                    </Link>
                </div>
            </SectionWrapper>

            <CtaBand title="Join the community on MANDE." />
        </>
    );
}
