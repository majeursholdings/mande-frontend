import { toPlainText, type PortableTextBlock } from "@portabletext/react";
import type { CmsImage } from "./client";

// Rich text (Portable Text) from the CMS: legal documents, help articles and
// blog posts. Rendered by components/common/richText.tsx.

export type RichTextImage = CmsImage & {
    _type: "bodyImage";
    _key: string;
    caption?: string | null;
    dimensions?: { width: number; height: number } | null;
};

export type RichTextCallout = { _type: "callout"; _key: string; tone: "tip" | "important"; text: string };

export type RichText = (PortableTextBlock | RichTextImage | RichTextCallout)[];

/** The projection for a rich text field, with what its pictures need to render. */
export const RICH_TEXT_FIELDS = `body[]{
    ...,
    _type == "bodyImage" => {
        ...,
        "lqip": asset->metadata.lqip,
        "dimensions": asset->metadata.dimensions{ width, height }
    }
}`;

/** "Getting paid" → "getting-paid", for headings' anchors. */
export function toAnchor(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export type RichTextHeading = { id: string; text: string };

function isBlock(node: RichText[number]): node is PortableTextBlock {
    return node._type === "block";
}

/** The section headings (h2), for an "On this page" list. */
export function getRichTextHeadings(body: RichText): RichTextHeading[] {
    return body
        .filter((node): node is PortableTextBlock => isBlock(node) && node.style === "h2")
        .map((block) => {
            const text = toPlainText(block);
            return { id: toAnchor(text), text };
        });
}

/** About how long the text takes to read, in whole minutes (at least 1). */
export function getReadingMinutes(body: RichText): number {
    const words = toPlainText(body.filter(isBlock)).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}
