import Link from "next/link";
import { formatOrdinalDate } from "@/lib/date";
import type { LegalDocument } from "@/lib/cms/legal";
import { MANUFACTURER_LEGAL_BACK_LINK, MANUFACTURER_SUPPORT_URL } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";

/** "Getting paid" → "getting-paid", for the table of contents' anchors. */
function toAnchor(heading: string): string {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default function LegalDocumentPage({ document }: { document: LegalDocument }) {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={document.title}
                description={`Last updated ${formatOrdinalDate(new Date(document.updatedAt))}`}
                backLink={MANUFACTURER_LEGAL_BACK_LINK}
            />

            <div className="flex gap-12">
                <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-8">
                    <LegalDocumentBody document={document} />
                    <p className="border-t border-border pt-6 text-sm font-text text-mist-500">
                        Questions about this policy?{" "}
                        <Link
                            href={MANUFACTURER_SUPPORT_URL}
                            className="font-medium text-secondary-700 hover:underline"
                        >
                            Talk to support
                        </Link>
                    </p>
                </div>

                <nav aria-label="On this page" className="hidden w-56 shrink-0 xl:block">
                    <div className="sticky top-28 flex flex-col gap-3">
                        <span className="text-xs font-semibold font-text uppercase tracking-wide text-mist-500">
                            On this page
                        </span>
                        <ul className="flex flex-col gap-2 border-l border-border">
                            {document.sections.map((section) => (
                                <li key={section.heading}>
                                    <a
                                        href={`#${toAnchor(section.heading)}`}
                                        className="-ml-px block border-l border-transparent pl-3 text-sm font-text text-mist-600 hover:border-secondary-600 hover:text-mist-950"
                                    >
                                        {section.heading}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </div>
        </div>
    );
}

// Renders the document's content — the one place to swap for Portable Text
// once the content comes from Sanity (see lib/cms/legal.ts)
function LegalDocumentBody({ document }: { document: LegalDocument }) {
    return (
        <article className="flex flex-col gap-8">
            {document.sections.map((section) => (
                <section
                    key={section.heading}
                    id={toAnchor(section.heading)}
                    className="flex scroll-mt-28 flex-col gap-3"
                >
                    <h2 className="text-lg font-semibold font-text text-mist-950">
                        {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-7 font-text text-mist-700">
                            {paragraph}
                        </p>
                    ))}
                </section>
            ))}
        </article>
    );
}
