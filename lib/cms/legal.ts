// ─────────────────────────────────────────────────────────────────────────────
// Legal documents (terms, privacy, payment policies…), from the CMS's
// "legalDocument" type. Shown on the website and in the manufacturer
// dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { cmsFetch } from "./client";
import { RICH_TEXT_FIELDS, type RichText } from "./richText";

export type LegalDocumentSummary = {
    slug: string;
    title: string;
    summary: string;
    /** ISO date of the last change in substance. */
    updatedAt: string;
};

export type LegalDocument = LegalDocumentSummary & {
    body: RichText;
};

// The CMS keeps "Last updated" as a calendar date (2026-06-01); midday UTC
// keeps it the same day in every time zone
const SUMMARY_FIELDS = `"slug": slug.current, title, summary, "updatedAt": updatedAt + "T12:00:00.000Z"`;

/** Every policy, in the CMS's order. */
export function getLegalDocuments(): Promise<LegalDocumentSummary[]> {
    return cmsFetch(`*[_type == "legalDocument" && defined(slug.current)] | order(order asc, title asc) { ${SUMMARY_FIELDS} }`);
}

/** One policy with its text, or null when there's none with that slug. */
export function getLegalDocument(slug: string): Promise<LegalDocument | null> {
    return cmsFetch(`*[_type == "legalDocument" && slug.current == $slug][0] { ${SUMMARY_FIELDS}, ${RICH_TEXT_FIELDS} }`, {
        slug,
    });
}
