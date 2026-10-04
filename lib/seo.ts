import type { Metadata } from "next";

/** The site's name as it shows in shared links. */
export const SITE_NAME = "MANDE";

/**
 * The picture for shared links, made by app/opengraph-image.tsx. Named here
 * because a page that sets its own openGraph replaces the root's, image and all.
 */
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "MANDE: grow your furniture business" };

/** Shared by every page's Open Graph tags. */
const OPEN_GRAPH_DEFAULTS = {
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website" as const,
    images: [SHARE_IMAGE],
};

/**
 * A public page's metadata: its title and description, the canonical address
 * (`path`, relative to metadataBase), and the same for shared links (Open
 * Graph, X). Next.js replaces a layout's `openGraph` rather than merging it,
 * so every page sets the whole lot through here.
 */
export function pageMetadata({
    title,
    description,
    path,
}: {
    title: string;
    description: string;
    /** e.g. "/open-jobs" */
    path: string;
}): Metadata {
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { ...OPEN_GRAPH_DEFAULTS, title, description, url: path },
        twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
    };
}
