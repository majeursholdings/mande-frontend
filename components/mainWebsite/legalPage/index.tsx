import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { formatOrdinalDate } from "@/lib/date";
import type { LegalDocumentSummary } from "@/lib/cms/legal";
import { CONTACT_URL, getLegalDocumentUrl } from "@/constant/navigation";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";

/** Legal information — every policy that applies on MANDE, each opening its own page. */
export default function LegalIndexPage({ documents }: { documents: LegalDocumentSummary[] }) {
    return (
        <>
            <PageHero
                eyebrow="Legal"
                title="Legal information."
                description="The policies that apply when you use MANDE: what we expect of you, what you can expect of us, and how your information is used."
            />

            <SectionWrapper containerClassName="flex flex-col gap-8">
                {documents.length === 0 ? (
                    <p className="rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center text-base font-light text-mist-600">
                        Our legal documents will appear here.
                    </p>
                ) : (
                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
                        {documents.map((document) => (
                            <li key={document.slug}>
                                <Link
                                    href={getLegalDocumentUrl(document.slug)}
                                    className="group flex h-full flex-col gap-4 rounded-[10px] border border-border bg-white p-6 transition-colors duration-300 hover:border-primary-300 lg:p-8"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-900">
                                        <FileText className="size-5" strokeWidth={1.75} aria-hidden />
                                    </span>
                                    <span className="flex flex-1 flex-col gap-2">
                                        <span className="text-xl font-medium">{document.title}</span>
                                        <span className="text-base font-light text-mist-700">{document.summary}</span>
                                    </span>
                                    <span className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm font-light text-mist-600">
                                        Updated {formatOrdinalDate(new Date(document.updatedAt))}
                                        <ArrowRight
                                            className="size-4 text-primary-800 transition-transform duration-300 group-hover:translate-x-1"
                                            aria-hidden
                                        />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="text-base font-light text-mist-700">
                    Questions about any of these?{" "}
                    <Link href={CONTACT_URL} className="font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                        Contact us
                    </Link>
                    .
                </p>
            </SectionWrapper>
        </>
    );
}
