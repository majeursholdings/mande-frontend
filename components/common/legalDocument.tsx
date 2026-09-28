import { cn } from "@/lib/utils";
import type { LegalDocument } from "@/lib/cms/legal";

// ─────────────────────────────────────────────────────────────────────────────
// A legal document's content and its "On this page" list — the same text in
// the manufacturer dashboard and on the website, styled for each ("website"
// is larger and lighter, like the site's other pages). The one place to swap
// for Portable Text once the content comes from Sanity (see lib/cms/legal.ts).
// ─────────────────────────────────────────────────────────────────────────────

/** "Getting paid" → "getting-paid", for the contents list's anchors. */
export function toLegalAnchor(heading: string): string {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

type Variant = "dashboard" | "website";

export function LegalDocumentBody({ document, variant = "dashboard" }: { document: LegalDocument; variant?: Variant }) {
    const isWebsite = variant === "website";
    return (
        <article className={cn("flex flex-col", isWebsite ? "gap-10" : "gap-8")}>
            {document.sections.map((section) => (
                <section
                    key={section.heading}
                    id={toLegalAnchor(section.heading)}
                    className={cn("flex flex-col gap-3", isWebsite ? "scroll-mt-24" : "scroll-mt-28")}
                >
                    <h2
                        className={
                            isWebsite
                                ? "text-2xl tracking-tight md:text-3xl"
                                : "text-lg font-semibold font-text text-mist-950"
                        }
                    >
                        {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph) => (
                        <p
                            key={paragraph}
                            className={
                                isWebsite
                                    ? "text-base leading-8 font-light text-mist-800"
                                    : "text-sm leading-7 font-text text-mist-700"
                            }
                        >
                            {paragraph}
                        </p>
                    ))}
                </section>
            ))}
        </article>
    );
}

/** Links to each section — sticky beside the document where there's room. */
export function LegalContents({
    document,
    variant = "dashboard",
    className,
}: {
    document: LegalDocument;
    variant?: Variant;
    className?: string;
}) {
    const isWebsite = variant === "website";
    return (
        <nav aria-label="On this page" className={className}>
            <div className={cn("sticky flex flex-col gap-3", isWebsite ? "top-24" : "top-28")}>
                <span className="text-xs font-semibold font-text uppercase tracking-wide text-mist-500">On this page</span>
                <ul className="flex flex-col gap-2 border-l border-border">
                    {document.sections.map((section) => (
                        <li key={section.heading}>
                            <a
                                href={`#${toLegalAnchor(section.heading)}`}
                                className={cn(
                                    "-ml-px block border-l border-transparent pl-3 text-sm font-text",
                                    isWebsite
                                        ? "font-light text-mist-700 hover:border-primary-700 hover:text-primary-950"
                                        : "text-mist-600 hover:border-secondary-600 hover:text-mist-950",
                                )}
                            >
                                {section.heading}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
