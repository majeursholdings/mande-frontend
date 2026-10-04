// ─────────────────────────────────────────────────────────────────────────────
// The Sanity CMS (the studio is in ../mande-sanity): FAQs, legal documents,
// the knowledge base and the blog. Queries run on the server through Next.js'
// fetch cache, like the website's API calls: each page is served from the
// cache and asks Sanity again at most once a minute.
//
// A query that fails throws. Lists catch it and show an error message where
// the content would be; a single document's page falls to the error page.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type QueryParams } from "@sanity/client";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "iprkoda4";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** How often, in seconds, a page asks Sanity again. */
const REVALIDATE_SECONDS = 60;

const client = createClient({
    projectId,
    dataset,
    apiVersion: "2026-10-01",
    useCdn: true,
    // Published content only, never drafts
    perspective: "published",
});

export function cmsFetch<T>(query: string, params: QueryParams = {}): Promise<T> {
    return client.fetch<T>(query, params, { next: { revalidate: REVALIDATE_SECONDS, tags: ["sanity"] } });
}

const imageBuilder = createImageUrlBuilder({ projectId, dataset });

/** A Sanity image's address, to size and crop with .width(), .height() and .url(). */
export function cmsImageUrl(source: SanityImageSource) {
    return imageBuilder.image(source).auto("format");
}

/** A picture from the CMS, as the queries project it. */
export type CmsImage = {
    asset: { _ref: string };
    hotspot?: { x: number; y: number; height: number; width: number };
    crop?: { top: number; bottom: number; left: number; right: number };
    alt: string;
    /** Tiny base64 version, shown blurred while the picture loads. */
    lqip?: string | null;
};

/** The fields to project for a CmsImage. */
export const CMS_IMAGE_FIELDS = `asset, hotspot, crop, alt, "lqip": asset->metadata.lqip`;
