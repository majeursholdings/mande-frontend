import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatOrdinalDate } from "@/lib/date";
import type { LegalDocument, LegalDocumentSummary } from "@/lib/cms/legal";
import { getRichTextHeadings } from "@/lib/cms/richText";
import { RichText, RichTextContents } from "@/components/common/richText";
import { CONTACT_URL, LEGALS_URL, getLegalDocumentUrl } from "@/constant/navigation";
import SectionWrapper from "../common/sectionWrapper";

// ─────────────────────────────────────────────────────────────────────────────
// A legal document on the website — its title and when it last changed, the
// text with an "On this page" list beside it from lg, then who to ask and
// the other policies.
// ─────────────────────────────────────────────────────────────────────────────

export default function LegalDocumentView({
    document,
    otherDocuments,
}: {
    document: LegalDocument;
    /** The rest of the policies, linked at the end. */
    otherDocuments: LegalDocumentSummary[];
}) {
    return (
        <>
            <section className="bg-mist-200 px-2.5 py-12.5 md:py-16">
                <div className="container mx-auto flex flex-col gap-4">
                    <Link
                        href={LEGALS_URL}
                        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Legal information
                    </Link>
                    <h1 className="text-3xl tracking-tight md:text-5xl">{document.title}</h1>
                    <p className="max-w-160 text-base font-light md:text-lg">{document.summary}</p>
                    <p className="text-sm font-light text-mist-700">
                        Last updated {formatOrdinalDate(new Date(document.updatedAt))}
                    </p>
                </div>
            </section>

            <SectionWrapper containerClassName="flex gap-16">
                <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-12">
                    <RichText value={document.body} />

                    <p className="border-t border-border pt-8 text-base font-light text-mist-700">
                        Questions about this policy?{" "}
                        <Link href={CONTACT_URL} className="font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                            Contact us
                        </Link>
                        .
                    </p>

                    {otherDocuments.length > 0 && (
                        <section aria-labelledby="other-policies" className="flex flex-col gap-4">
                            <h2 id="other-policies" className="text-xl font-medium">
                                Other policies
                            </h2>
                            <ul className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white">
                                {otherDocuments.map((other) => (
                                    <li key={other.slug}>
                                        <Link
                                            href={getLegalDocumentUrl(other.slug)}
                                            className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-mist-100"
                                        >
                                            <span className="flex flex-col gap-0.5">
                                                <span className="text-base font-medium">{other.title}</span>
                                                <span className="text-sm font-light text-mist-600">{other.summary}</span>
                                            </span>
                                            <ArrowRight
                                                className="size-4 shrink-0 text-primary-800 transition-transform duration-300 group-hover:translate-x-1"
                                                aria-hidden
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <RichTextContents headings={getRichTextHeadings(document.body)} className="hidden w-60 shrink-0 lg:block" />
            </SectionWrapper>
        </>
    );
}
