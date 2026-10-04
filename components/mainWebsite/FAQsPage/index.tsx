import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFaqTokens } from "@/constant/website";
import { fillFaqTokens, getFaqGroups } from "@/lib/cms/faq";
import { getWebsitePlans, toPricingPlan } from "@/lib/services/websiteService";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import StillHaveAQuestion from "../common/stillHaveAQuestion";

// ─────────────────────────────────────────────────────────────────────────────
// FAQs — the questions in groups (topics from the CMS), with jump links to
// each: beside them on desktop, a scrolling row on phones. Then a way to ask
// anything else.
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
                {/* The questions stream in from the CMS, with the plans some answers name */}
                <Suspense fallback={<FaqsSkeleton />}>
                    <Faqs />
                </Suspense>
            </SectionWrapper>
        </>
    );
}

async function Faqs() {
    const [groups, plansData] = await Promise.all([getFaqGroups("website").catch(() => null), getWebsitePlans()]);
    const plans = (plansData?.plans ?? []).map(toPricingPlan);
    // Some answers name the plans and their prices, filled in from the API
    const faqGroups = groups && fillFaqTokens(groups, getFaqTokens(plansData?.discountPercent ?? 0, plans));

    if (!faqGroups || faqGroups.length === 0) {
        return (
            <div className="flex min-w-0 flex-1 flex-col gap-12">
                <p className="text-base font-light text-mist-700" role={faqGroups ? undefined : "alert"}>
                    {faqGroups
                        ? "Our FAQs will appear here soon. In the meantime, our team is happy to help."
                        : "The FAQs couldn't be loaded right now. Please refresh the page in a minute."}
                </p>
                <StillHaveAQuestion />
            </div>
        );
    }

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
                // From the CMS, live plan data and platform rules, no user input
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
                                    <AccordionItem key={faq.key} value={faq.key}>
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
