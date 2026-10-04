import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircleQuestion } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CONTACT_URL } from "@/constant/navigation";
import { CONTACT_DETAILS, getWebsiteFaqGroups } from "@/constant/website";
import { getWebsitePlans, toPricingPlan } from "@/lib/services/websiteService";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

// ─────────────────────────────────────────────────────────────────────────────
// FAQs — the questions in groups (getting started, jobs, payments, plans,
// account), with jump links to each: beside them on desktop, a scrolling
// row on phones. Then a way to ask anything else.
// ─────────────────────────────────────────────────────────────────────────────

export default function FAQsPage() {
    return (
        <>
            <PageHero
                eyebrow="FAQs"
                title="Questions, answered."
                description="Everything about joining MANDE, taking on jobs, getting paid and choosing a plan."
            />

            <SectionWrapper containerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
                {/* Some answers name the plans and their prices, so the questions stream in with them */}
                <Suspense fallback={<FaqsSkeleton />}>
                    <Faqs />
                </Suspense>
            </SectionWrapper>
        </>
    );
}

/** Below the questions: a way to ask anything else. */
function StillHaveAQuestion() {
    return (
        <div className="flex flex-col items-start gap-4 rounded-[10px] bg-mist-200 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex gap-4">
                <MessageCircleQuestion className="mt-0.5 size-6 shrink-0 text-primary-800" strokeWidth={1.5} aria-hidden />
                <div className="flex flex-col gap-1">
                    <p className="text-lg font-medium">Still have a question?</p>
                    <p className="text-sm font-light text-mist-700">
                        Our team is here {CONTACT_DETAILS.hours}.
                    </p>
                </div>
            </div>
            <Link href={CONTACT_URL} className={WEBSITE_PRIMARY_BUTTON}>
                Contact us
            </Link>
        </div>
    );
}

async function Faqs() {
    const plansData = await getWebsitePlans();
    const plans = (plansData?.plans ?? []).map(toPricingPlan);

    if (plans.length === 0) {
        return (
            <div className="flex min-w-0 flex-1 flex-col gap-12">
                <p className="text-base font-light text-mist-700">
                    The FAQs couldn&apos;t be loaded right now. Please refresh the page in a minute.
                </p>
                <StillHaveAQuestion />
            </div>
        );
    }

    const faqGroups = getWebsiteFaqGroups(plansData?.discountPercent ?? 0, plans);

    // For search engines: the questions and answers as FAQPage structured data
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqGroups.flatMap((group) =>
            group.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
        ),
    };

    return (
        <>
            <script
                type="application/ld+json"
                // Generated from live plan data and platform rules, no user input
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />

            <nav aria-label="FAQ topics" className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
                <ul className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                    {faqGroups.map((group) => (
                        <li key={group.id} className="shrink-0">
                            <a
                                href={`#${group.id}`}
                                className="block rounded-full border border-border px-4 py-1.5 text-sm whitespace-nowrap text-mist-700 transition-colors hover:border-primary-300 hover:text-primary-900 lg:rounded-md lg:border-0 lg:px-3 lg:py-2 lg:hover:bg-mist-100"
                            >
                                {group.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="flex min-w-0 flex-1 flex-col gap-12">
                {faqGroups.map((group) => (
                    <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-24">
                        <h2 id={`${group.id}-title`} className="mb-4 text-2xl tracking-tight md:text-3xl">
                            {group.title}
                        </h2>
                        <div className="rounded-[10px] border border-border bg-white px-5 md:px-6">
                            <Accordion multiple>
                                {group.faqs.map((faq) => (
                                    <AccordionItem key={faq.question} value={faq.question}>
                                        <AccordionTrigger className="py-5 text-base font-normal hover:text-primary-800 focus-visible:text-primary-800">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-5 text-base font-light leading-7 text-mist-700">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </section>
                ))}

                <StillHaveAQuestion />
            </div>
        </>
    );
}

/** The topics and questions while the plans they name load. */
function FaqsSkeleton() {
    return (
        <>
            <div aria-hidden className="flex gap-2 overflow-hidden lg:sticky lg:top-24 lg:w-60 lg:shrink-0 lg:flex-col lg:gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full lg:w-40 lg:rounded-md" />
                ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-12">
                {[1, 2].map((group) => (
                    <div key={group} aria-hidden className="flex flex-col gap-4">
                        <Skeleton className="h-8 w-48" />
                        <div className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white px-5 md:px-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="py-5">
                                    <Skeleton className="h-5 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <StillHaveAQuestion />
            </div>
        </>
    );
}
