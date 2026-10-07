// ─────────────────────────────────────────────────────────────────────────────
// Community — Mande's social channels and maker testimonials.
// Managed by Super Admins from Platform Settings › Community.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMUNITY_PLATFORMS = [
    "whatsapp",
    "tiktok",
    "instagram",
    "linkedin",
    "x",
    "youtube",
    "facebook",
    "telegram",
] as const;

export type CommunityPlatform =
    | (typeof COMMUNITY_PLATFORMS)[number]
    | "mande";

export type CommunityChannel = {
    platform: CommunityPlatform;
    /** e.g. "@mande" or the channel's name. */
    handle: string;
    description: string;
    /** e.g. "12k followers" or "2,400+ members". */
    audience?: string;
    followerCount?: number;
    followerCountFormatted?: string;
    manualFollowerOverride?: number | null;
    /** Call to action, e.g. "Follow". */
    cta: string;
    href: string;
    isFeatured?: boolean;
    isActive?: boolean;
};

export type CommunityTestimonial = {
    id: string;
    /** Where it was posted or originating platform. */
    platform: CommunityPlatform;
    quote: string;
    name: string;
    business: string;
    avatarUrl?: string | null;
    sourceUrl?: string | null;
    rating?: number;
    verifiedMaker?: boolean;
    isFeatured?: boolean;
    createdAt?: string;
};

/** Default featured WhatsApp channel shown above other channels */
export const FEATURED_COMMUNITY_CHANNEL: CommunityChannel = {
    platform: "whatsapp",
    handle: "Mande Makers",
    description:
        "New job alerts, payout updates and tips from the team, straight to your phone before anywhere else.",
    audience: "2,400+ members",
    followerCount: 2400,
    followerCountFormatted: "2,400+ members",
    cta: "Join the channel",
    href: "https://www.whatsapp.com/channel",
    isFeatured: true,
    isActive: true,
};

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
    {
        platform: "tiktok",
        handle: "@mande",
        description: "Behind-the-scenes builds, finishes and workshop hacks.",
        audience: "18k followers",
        followerCount: 18000,
        followerCountFormatted: "18k followers",
        cta: "Follow",
        href: "https://www.tiktok.com",
        isActive: true,
    },
    {
        platform: "instagram",
        handle: "@mande",
        description: "Finished pieces from makers on Mande, and the stories behind them.",
        audience: "9.6k followers",
        followerCount: 9600,
        followerCountFormatted: "9.6k followers",
        cta: "Follow",
        href: "https://www.instagram.com",
        isActive: true,
    },
    {
        platform: "linkedin",
        handle: "Mande",
        description: "Company news, partnerships and roles on the team.",
        audience: "3.1k followers",
        followerCount: 3100,
        followerCountFormatted: "3.1k followers",
        cta: "Follow",
        href: "https://www.linkedin.com",
        isActive: true,
    },
    {
        platform: "x",
        handle: "@mande",
        description: "Quick updates, announcements and platform status.",
        audience: "5.2k followers",
        followerCount: 5200,
        followerCountFormatted: "5.2k followers",
        cta: "Follow",
        href: "https://x.com",
        isActive: true,
    },
    {
        platform: "youtube",
        handle: "Mande",
        description: "How-to guides for the platform and full build walkthroughs.",
        audience: "1.8k subscribers",
        followerCount: 1800,
        followerCountFormatted: "1.8k subscribers",
        cta: "Subscribe",
        href: "https://www.youtube.com",
        isActive: true,
    },
    {
        platform: "facebook",
        handle: "Mande Makers Group",
        description: "Ask questions and swap advice with other manufacturers.",
        audience: "4.5k members",
        followerCount: 4500,
        followerCountFormatted: "4.5k members",
        cta: "Join the group",
        href: "https://www.facebook.com",
        isActive: true,
    },
    {
        platform: "telegram",
        handle: "Mande Community",
        description: "Community announcements, discussions and live updates.",
        audience: "1.2k members",
        followerCount: 1200,
        followerCountFormatted: "1.2k members",
        cta: "Join channel",
        href: "https://t.me",
        isActive: true,
    },
];

export const COMMUNITY_TESTIMONIALS: CommunityTestimonial[] = [
    {
        id: "t-1",
        platform: "whatsapp",
        quote: "The job alerts on the channel mean I see new orders the minute they drop. I picked up two last month that way.",
        name: "Chidi Okafor",
        business: "Okafor Woodworks",
        rating: 5,
        verifiedMaker: true,
        isFeatured: true,
    },
    {
        id: "t-2",
        platform: "instagram",
        quote: "Mande shared our dining set on their page and we got three enquiries that week. Proud of this community.",
        name: "Amaka Eze",
        business: "Eze Interiors",
        rating: 5,
        verifiedMaker: true,
        isFeatured: false,
    },
    {
        id: "t-3",
        platform: "mande",
        quote: "Getting signed off by the project lead on delivery was seamless. Payment hit my wallet instantly. Working with Mande changed our shop's cash flow.",
        name: "Babatunde Alabi",
        business: "Prime Finish Carpentry",
        rating: 5,
        verifiedMaker: true,
        isFeatured: true,
    },
    {
        id: "t-4",
        platform: "tiktok",
        quote: "Learnt a better way to finish walnut from another maker's video. Saved me hours on my last job.",
        name: "Tunde Bakare",
        business: "Bakare & Sons",
        rating: 5,
        verifiedMaker: false,
        isFeatured: false,
    },
    {
        id: "t-5",
        platform: "linkedin",
        quote: "Getting paid in installments as production moves along has made running my workshop so much easier.",
        name: "Ngozi Adeyemi",
        business: "Adeyemi Upholstery",
        rating: 5,
        verifiedMaker: true,
        isFeatured: false,
    },
    {
        id: "t-6",
        platform: "facebook",
        quote: "Whenever I'm stuck, someone in the group has already solved it. It's like having ten mentors.",
        name: "Ibrahim Musa",
        business: "Musa Metalcraft",
        rating: 5,
        verifiedMaker: false,
        isFeatured: false,
    },
    {
        id: "t-7",
        platform: "x",
        quote: "Support sorted my withdrawal question in minutes. The makers community here is genuinely supportive.",
        name: "Folake Ojo",
        business: "Ojo Furniture Studio",
        rating: 5,
        verifiedMaker: true,
        isFeatured: false,
    },
];
