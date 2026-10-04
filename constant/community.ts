// ─────────────────────────────────────────────────────────────────────────────
// Community — Mande's social channels. Set each `href` to the channel's own
// URL (they point at the platforms' home pages until then). A good candidate
// to move into the CMS with the legal documents — see lib/cms/legal.ts.
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
    /** Call to action, e.g. "Follow". */
    cta: string;
    href: string;
};

/** Shown on its own, above the other channels. */
export const FEATURED_COMMUNITY_CHANNEL: CommunityChannel = {
    platform: "whatsapp",
    handle: "Mande Makers",
    description:
        "New job alerts, payout updates and tips from the team, straight to your phone before anywhere else.",
    cta: "Join the channel",
    href: "https://www.whatsapp.com/channel",
};

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
    {
        platform: "tiktok",
        handle: "@mande",
        description: "Behind-the-scenes builds, finishes and workshop hacks.",
        cta: "Follow",
        href: "https://www.tiktok.com",
    },
    {
        platform: "instagram",
        handle: "@mande",
        description: "Finished pieces from makers on Mande, and the stories behind them.",
        cta: "Follow",
        href: "https://www.instagram.com",
    },
    {
        platform: "linkedin",
        handle: "Mande",
        description: "Company news, partnerships and roles on the team.",
        cta: "Follow",
        href: "https://www.linkedin.com",
    },
    {
        platform: "x",
        handle: "@mande",
        description: "Quick updates, announcements and platform status.",
        cta: "Follow",
        href: "https://x.com",
    },
    {
        platform: "youtube",
        handle: "Mande",
        description: "How-to guides for the platform and full build walkthroughs.",
        cta: "Subscribe",
        href: "https://www.youtube.com",
    },
    {
        platform: "facebook",
        handle: "Mande Makers Group",
        description: "Ask questions and swap advice with other manufacturers.",
        cta: "Join the group",
        href: "https://www.facebook.com",
    },
];

