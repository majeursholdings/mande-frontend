// ─────────────────────────────────────────────────────────────────────────────
// FAQs, from the CMS's "faqCategory" type: topics in order, each with its
// questions, for the website's FAQs page or the manufacturer dashboard's
// support page (each topic says where it shows). Answers are plain text that
// can name platform values as {{placeholders}} (see getFaqTokens in
// constant/website.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { cmsFetch } from "./client";

export type Faq = { key: string; question: string; answer: string };

export type FaqGroup = {
    /** For the page's jump links, e.g. #payments. */
    id: string;
    title: string;
    faqs: Faq[];
};

/** Where a topic of FAQs shows. */
export type FaqPlacement = "website" | "support";

/** The topics for one page and their questions, answers as written (placeholders not yet filled in). */
export function getFaqGroups(placement: FaqPlacement): Promise<FaqGroup[]> {
    // Topics from before "Show on" existed are the website's
    const placed = placement === "website" ? `(!defined(showOn) || $placement in showOn)` : `$placement in showOn`;
    return cmsFetch(
        `*[_type == "faqCategory" && defined(slug.current) && count(faqs) > 0 && ${placed}] | order(order asc, title asc) {
            "id": slug.current,
            title,
            "faqs": faqs[defined(question) && defined(answer)]{ "key": _key, question, answer }
        }`,
        { placement },
    );
}

/**
 * The FAQs with each {{placeholder}} filled in from `tokens`, or null when an
 * answer names one that has no value (an unknown name, or the plans couldn't
 * be loaded), rather than show a broken sentence.
 */
export function fillFaqTokens(groups: FaqGroup[], tokens: Record<string, string>): FaqGroup[] | null {
    let missing = false;
    const filled = groups.map((group) => ({
        ...group,
        faqs: group.faqs.map((faq) => ({
            ...faq,
            answer: faq.answer.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, name: string) => {
                if (name in tokens) return tokens[name];
                missing = true;
                return placeholder;
            }),
        })),
    }));
    return missing ? null : filled;
}
