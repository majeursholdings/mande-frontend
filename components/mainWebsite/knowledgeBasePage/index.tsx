import { Suspense } from "react";
import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KNOWLEDGE_BASE_URL } from "@/constant/navigation";
import { getKnowledgeBaseCategories, searchKnowledgeBase } from "@/lib/cms/knowledgeBase";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import StillHaveAQuestion from "../common/stillHaveAQuestion";
import ArticleLink from "./articleLink";

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge base — step-by-step help articles from the CMS. A search box in
// the hero; below it every category with its articles (jump links beside
// them on desktop, like the FAQs), or the results for what was searched.
// ─────────────────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage({ query }: { query: string }) {
    return (
        <>
            <PageHero
                eyebrow="Knowledge base"
                title="How can we help?"
                description="Step-by-step guides to getting set up, taking on jobs, getting paid and running your account."
            >
                <SearchForm query={query} />
            </PageHero>

            <SectionWrapper containerClassName="flex flex-col gap-12">
                {/* A new search shows the skeleton again rather than the last results */}
                <Suspense key={query} fallback={query ? <ArticleListSkeleton /> : <CategoriesSkeleton />}>
                    {query ? <SearchResults query={query} /> : <Categories />}
                </Suspense>
                <StillHaveAQuestion />
            </SectionWrapper>
        </>
    );
}

function SearchForm({ query }: { query: string }) {
    return (
        <Form action={KNOWLEDGE_BASE_URL} role="search" className="relative w-full max-w-140">
            <label htmlFor="knowledge-base-search" className="sr-only">
                Search the knowledge base
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mist-500" aria-hidden />
            <input
                id="knowledge-base-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search, e.g. withdrawals"
                className="h-12 w-full rounded-full border border-mist-300 bg-white pr-28 pl-12 text-base outline-none placeholder:text-mist-500 focus-visible:border-primary-700 focus-visible:ring-3 focus-visible:ring-primary-200"
            />
            <button
                type="submit"
                className="absolute top-1.5 right-1.5 h-9 rounded-full bg-primary-950 px-5 text-sm text-mist-100 transition-colors hover:bg-primary-500 hover:text-primary-950"
            >
                Search
            </button>
        </Form>
    );
}

async function Categories() {
    const categories = await getKnowledgeBaseCategories().catch(() => null);

    if (!categories) {
        return (
            <p role="alert" className="text-base font-light text-mist-700">
                The knowledge base couldn&apos;t be loaded right now. Please refresh the page in a minute.
            </p>
        );
    }
    if (categories.length === 0) {
        return (
            <p className="rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center text-base font-light text-mist-600">
                Our help articles will appear here soon.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
            <nav aria-label="Knowledge base categories" className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
                <ul className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                    {categories.map((category) => (
                        <li key={category.slug} className="shrink-0">
                            <a
                                href={`#${category.slug}`}
                                className="block rounded-full border border-border px-4 py-1.5 text-sm whitespace-nowrap text-mist-700 transition-colors hover:border-primary-300 hover:text-primary-900 lg:rounded-md lg:border-0 lg:px-3 lg:py-2 lg:hover:bg-mist-100"
                            >
                                {category.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="flex min-w-0 flex-1 flex-col gap-12">
                {categories.map((category) => (
                    <section
                        key={category.slug}
                        id={category.slug}
                        aria-labelledby={`${category.slug}-title`}
                        className="flex scroll-mt-24 flex-col gap-4"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 id={`${category.slug}-title`} className="text-2xl tracking-tight md:text-3xl">
                                {category.title}
                            </h2>
                            {category.description && (
                                <p className="text-base font-light text-mist-700">{category.description}</p>
                            )}
                        </div>
                        <ul className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white">
                            {category.articles.map((article) => (
                                <li key={article.slug}>
                                    <ArticleLink {...article} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    );
}

async function SearchResults({ query }: { query: string }) {
    const results = await searchKnowledgeBase(query).catch(() => null);

    return (
        <section aria-labelledby="search-results-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="search-results-title" className="text-2xl tracking-tight md:text-3xl">
                    {results
                        ? `${results.length === 0 ? "No" : results.length} result${results.length === 1 ? "" : "s"} for “${query}”`
                        : `Results for “${query}”`}
                </h2>
                <Link href={KNOWLEDGE_BASE_URL} className="text-sm font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                    See all articles
                </Link>
            </div>

            {!results ? (
                <p role="alert" className="text-base font-light text-mist-700">
                    The search couldn&apos;t be run right now. Please try again in a minute.
                </p>
            ) : results.length === 0 ? (
                <p className="text-base font-light text-mist-700">
                    Try different words, or browse all the articles. If you still can&apos;t find it, our team can help.
                </p>
            ) : (
                <ul className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white">
                    {results.map((article) => (
                        <li key={article.slug}>
                            <ArticleLink {...article} meta={article.category} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function ArticleListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div aria-hidden className="flex flex-col divide-y divide-border rounded-[10px] border border-border bg-white">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex flex-col gap-2 px-5 py-4 md:px-6">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ))}
        </div>
    );
}

function CategoriesSkeleton() {
    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
            <div aria-hidden className="flex gap-2 overflow-hidden lg:w-60 lg:shrink-0 lg:flex-col lg:gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full lg:w-40 lg:rounded-md" />
                ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-12">
                {[1, 2].map((group) => (
                    <div key={group} className="flex flex-col gap-4">
                        <Skeleton className="h-8 w-48" />
                        <ArticleListSkeleton rows={3} />
                    </div>
                ))}
            </div>
        </div>
    );
}
