// ─────────────────────────────────────────────────────────────────────────────
// Legal documents (terms, privacy, payment policies…) — managed in the CMS,
// most likely Sanity. Until it's connected these return sample content, with
// the same shape the pages will get from the CMS.
//
// To connect Sanity: create a client with @sanity/client and replace the
// bodies below with GROQ queries, e.g.
//   *[_type == "legalDocument"] | order(order asc) { title, "slug": slug.current, summary, updatedAt }
//   *[_type == "legalDocument" && slug.current == $slug][0] { ..., body }
// Sanity stores rich text as Portable Text — swap `sections` for the `body`
// field and render it with @portabletext/react in LegalDocumentBody.
// ─────────────────────────────────────────────────────────────────────────────

export type LegalDocumentSummary = {
    slug: string;
    title: string;
    summary: string;
    /** ISO date of the last change. */
    updatedAt: string;
};

export type LegalSection = {
    heading: string;
    paragraphs: string[];
};

export type LegalDocument = LegalDocumentSummary & {
    sections: LegalSection[];
};

// Sample content — placeholder wording, not the final policies
const SAMPLE_LEGAL_DOCUMENTS: LegalDocument[] = [
    {
        slug: "terms-and-conditions",
        title: "Terms and conditions",
        summary: "The rules for using Mande as a manufacturer.",
        updatedAt: "2026-06-01T12:00:00.000Z",
        sections: [
            {
                heading: "About these terms",
                paragraphs: [
                    "These terms apply when you use Mande to find, accept and deliver furniture jobs. By creating an account, you agree to them.",
                    "We may update these terms from time to time. When we make a significant change, we'll let you know before it takes effect.",
                ],
            },
            {
                heading: "Your account",
                paragraphs: [
                    "You're responsible for keeping your login details safe and for everything that happens on your account.",
                    "The details you give us — including your company information and NIN card — must be accurate and kept up to date.",
                ],
            },
            {
                heading: "Jobs",
                paragraphs: [
                    "When you accept a job, you agree to deliver it to the specification and by the due date shown. If you can't, report a delay as early as possible.",
                    "Finished work is reviewed before it's marked complete. Work that doesn't meet the specification may be rejected and need to be redone.",
                ],
            },
            {
                heading: "Ending your account",
                paragraphs: [
                    "You can cancel your plan at any time from Settings. We may suspend accounts that break these terms.",
                ],
            },
        ],
    },
    {
        slug: "privacy-policy",
        title: "Privacy policy",
        summary: "What we collect about you, and how we use and protect it.",
        updatedAt: "2026-05-18T12:00:00.000Z",
        sections: [
            {
                heading: "What we collect",
                paragraphs: [
                    "Your name, contact details, company information, bank account for payouts, and the documents you upload to get verified, such as your NIN card.",
                    "We also collect how you use Mande — the jobs you view and accept, and your device and browser information.",
                ],
            },
            {
                heading: "How we use it",
                paragraphs: [
                    "To run your account, match you with jobs, pay you, verify your identity, and keep the platform safe.",
                    "We don't sell your personal information.",
                ],
            },
            {
                heading: "Who we share it with",
                paragraphs: [
                    "Payment and identity verification partners, only as needed to provide those services, and authorities when the law requires it.",
                ],
            },
            {
                heading: "Your choices",
                paragraphs: [
                    "You can update most of your details in Settings, and ask us for a copy of your data or to delete it by contacting support.",
                ],
            },
        ],
    },
    {
        slug: "payment-policy",
        title: "Payment policy",
        summary: "How and when you're paid, and the charges on withdrawals.",
        updatedAt: "2026-04-02T12:00:00.000Z",
        sections: [
            {
                heading: "Getting paid",
                paragraphs: [
                    "Payments for a job are made in installments as it moves through production, and land in your Mande balance.",
                ],
            },
            {
                heading: "Withdrawals",
                paragraphs: [
                    "You can withdraw your balance to the bank account on your profile. Withdrawals are confirmed with your password and a one-time code.",
                    "Bank charges and our processing partner's fee are added to each withdrawal. How much depends on the partner and your bank.",
                ],
            },
            {
                heading: "Currency",
                paragraphs: ["All payments on Mande are in Nigerian naira (NGN) for now."],
            },
        ],
    },
    {
        slug: "subscription-and-cancellation-policy",
        title: "Subscription and cancellation policy",
        summary: "How plans are billed, changed and cancelled.",
        updatedAt: "2026-04-02T12:00:00.000Z",
        sections: [
            {
                heading: "Billing",
                paragraphs: [
                    "Plans are billed monthly or yearly, in advance. Yearly billing costs the same as 10 months.",
                ],
            },
            {
                heading: "Changing plans",
                paragraphs: [
                    "Upgrades start straight away: you pay the difference for the rest of your billing period. Downgrades start when the current period ends.",
                    "Workshop and Studio plans need your company tax number and business license number.",
                ],
            },
            {
                heading: "Cancelling",
                paragraphs: [
                    "If you cancel, your plan stays active until the end of the billing period and then won't renew. Payments already made aren't refunded.",
                ],
            },
        ],
    },
];

export async function getLegalDocuments(): Promise<LegalDocumentSummary[]> {
    return SAMPLE_LEGAL_DOCUMENTS.map(({ slug, title, summary, updatedAt }) => ({
        slug,
        title,
        summary,
        updatedAt,
    }));
}

export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
    return SAMPLE_LEGAL_DOCUMENTS.find((document) => document.slug === slug) ?? null;
}
