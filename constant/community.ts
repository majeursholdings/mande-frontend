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
    /** The channel's page. Empty until a super admin adds it. */
    url: string;
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
