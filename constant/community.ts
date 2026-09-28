// ─────────────────────────────────────────────────────────────────────────────
// Community — Mande's social channels and what makers say about Mande there.
// Sample content: the links point at each platform's home page until the
// real channel URLs are set here, and the audience numbers and testimonials
// are placeholders. (A good candidate to move into the CMS with the legal
// documents — see lib/cms/legal.ts.)
// ─────────────────────────────────────────────────────────────────────────────

export type CommunityPlatform =
    | "whatsapp"
    | "tiktok"
    | "instagram"
    | "linkedin"
    | "x"
    | "youtube"
    | "facebook";

export type CommunityChannel = {
    platform: CommunityPlatform;
    /** e.g. "@mande" or the channel's name. */
    handle: string;
    description: string;
    /** e.g. "12k followers". */
    audience: string;
    /** Call to action, e.g. "Follow". */
    cta: string;
    href: string;
};

export type CommunityTestimonial = {
    id: string;
    /** Where it was posted. */
    platform: CommunityPlatform;
    quote: string;
    name: string;
    business: string;
};

/** Shown on its own, above the other channels. */
export const FEATURED_COMMUNITY_CHANNEL: CommunityChannel = {
    platform: "whatsapp",
    handle: "Mande Makers",
    description:
        "New job alerts, payout updates and tips from the team, straight to your phone before anywhere else.",
    audience: "2,400+ members",
    cta: "Join the channel",
    href: "https://www.whatsapp.com/channel",
};

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
    {
        platform: "tiktok",
        handle: "@mande",
        description: "Behind-the-scenes builds, finishes and workshop hacks.",
        audience: "18k followers",
        cta: "Follow",
        href: "https://www.tiktok.com",
    },
    {
        platform: "instagram",
        handle: "@mande",
        description: "Finished pieces from makers on Mande, and the stories behind them.",
        audience: "9.6k followers",
        cta: "Follow",
        href: "https://www.instagram.com",
    },
    {
        platform: "linkedin",
        handle: "Mande",
        description: "Company news, partnerships and roles on the team.",
        audience: "3.1k followers",
        cta: "Follow",
        href: "https://www.linkedin.com",
    },
    {
        platform: "x",
        handle: "@mande",
        description: "Quick updates, announcements and platform status.",
        audience: "5.2k followers",
        cta: "Follow",
        href: "https://x.com",
    },
    {
        platform: "youtube",
        handle: "Mande",
        description: "How-to guides for the platform and full build walkthroughs.",
        audience: "1.8k subscribers",
        cta: "Subscribe",
        href: "https://www.youtube.com",
    },
    {
        platform: "facebook",
        handle: "Mande Makers Group",
        description: "Ask questions and swap advice with other manufacturers.",
        audience: "4.5k members",
        cta: "Join the group",
        href: "https://www.facebook.com",
    },
];

export const COMMUNITY_TESTIMONIALS: CommunityTestimonial[] = [
    {
        id: "t-1",
        platform: "whatsapp",
        quote: "The job alerts on the channel mean I see new orders the minute they drop. I picked up two last month that way.",
        name: "Chidi Okafor",
        business: "Okafor Woodworks",
    },
    {
        id: "t-2",
        platform: "instagram",
        quote: "Mande shared our dining set on their page and we got three enquiries that week. Proud of this community.",
        name: "Amaka Eze",
        business: "Eze Interiors",
    },
    {
        id: "t-3",
        platform: "tiktok",
        quote: "Learnt a better way to finish walnut from another maker's video. Saved me hours on my last job.",
        name: "Tunde Bakare",
        business: "Bakare & Sons",
    },
    {
        id: "t-4",
        platform: "linkedin",
        quote: "Getting paid in installments as production moves along has made running my workshop so much easier.",
        name: "Ngozi Adeyemi",
        business: "Adeyemi Upholstery",
    },
    {
        id: "t-5",
        platform: "facebook",
        quote: "Whenever I'm stuck, someone in the group has already solved it. It's like having ten mentors.",
        name: "Ibrahim Musa",
        business: "Musa Metalcraft",
    },
    {
        id: "t-6",
        platform: "x",
        quote: "Support sorted my withdrawal question in minutes. That's rare.",
        name: "Folake Ojo",
        business: "Ojo Furniture Studio",
    },
];
