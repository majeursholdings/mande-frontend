import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_URL } from "@/constant/navigation";
import { BLOG_PAGE_SIZE, getBlogCategories, getBlogPosts } from "@/lib/cms/blog";
import PageHero from "../common/pageHero";
import SectionWrapper from "../common/sectionWrapper";
import PostCard, { PostCardSkeleton } from "./postCard";

// ─────────────────────────────────────────────────────────────────────────────
// Blog — posts from the CMS, newest first: a row of categories to filter by,
// the latest post wide on the first page, the rest in a grid, and links to
// older and newer pages.
// ─────────────────────────────────────────────────────────────────────────────

/** The blog's address for a page and category ("/blog?category=guides&page=2"). */
function getBlogListUrl({ page = 1, category }: { page?: number; category?: string }): string {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const search = params.toString();
    return search ? `${BLOG_URL}?${search}` : BLOG_URL;
}

export default function BlogPage({ page, category }: { page: number; category?: string }) {
    return (
        <>
            <PageHero
                eyebrow="Blog"
                title="Notes from the workshop."
                description="News from MANDE, practical guides for furniture makers, and stories from the workshops building with us."
            />

            <SectionWrapper containerClassName="flex flex-col gap-8 md:gap-10">
                <Suspense fallback={<CategoriesSkeleton />}>
                    <Categories active={category} />
                </Suspense>
                {/* A new page or category shows the skeleton again rather than the last posts */}
                <Suspense key={`${category}-${page}`} fallback={<PostsSkeleton featured={page === 1 && !category} />}>
                    <Posts page={page} category={category} />
                </Suspense>
            </SectionWrapper>
        </>
    );
}

async function Categories({ active }: { active?: string }) {
    // Filtering is a nicety: without the categories the posts still show
    const categories = await getBlogCategories().catch(() => []);
    if (categories.length < 2) return null;

    const options = [{ slug: undefined, title: "All posts" }, ...categories];
    return (
        <nav aria-label="Blog categories">
            <ul className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {options.map((option) => {
                    const isActive = option.slug === active;
                    return (
                        <li key={option.slug ?? "all"} className="shrink-0">
                            <Link
                                href={getBlogListUrl({ category: option.slug })}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "block rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
                                    isActive
                                        ? "border-primary-950 bg-primary-950 text-mist-100"
                                        : "border-border text-mist-700 hover:border-primary-300 hover:text-primary-900",
                                )}
                            >
                                {option.title}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

async function Posts({ page, category }: { page: number; category?: string }) {
    const result = await getBlogPosts({ page, category }).catch(() => null);

    if (!result) {
        return (
            <p role="alert" className="text-base font-light text-mist-700">
                The blog couldn&apos;t be loaded right now. Please refresh the page in a minute.
            </p>
        );
    }

    const { posts, total } = result;
    const pageCount = Math.ceil(total / BLOG_PAGE_SIZE);

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center">
                <p className="text-base font-light text-mist-600">
                    {total > 0 ? "There are no posts on this page." : "Our first posts will appear here soon."}
                </p>
                {(total > 0 || category) && (
                    <Link href={BLOG_URL} className="text-sm font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                        See the latest posts
                    </Link>
                )}
            </div>
        );
    }

    // The newest post leads the blog's front page
    const hasFeatured = page === 1 && !category;
    const featured = hasFeatured ? posts[0] : null;
    const rest = hasFeatured ? posts.slice(1) : posts;

    return (
        <div className="flex flex-col gap-10">
            {featured && <PostCard post={featured} featured />}

            {rest.length > 0 && (
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {rest.map((post) => (
                        <li key={post.slug}>
                            <PostCard post={post} />
                        </li>
                    ))}
                </ul>
            )}

            {pageCount > 1 && (
                <nav aria-label="Blog pages" className="flex items-center justify-between gap-4 border-t border-border pt-6">
                    {page > 1 ? (
                        <Link
                            href={getBlogListUrl({ page: page - 1, category })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            Newer posts
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-sm font-light text-mist-600">
                        Page {page} of {pageCount}
                    </span>
                    {page < pageCount ? (
                        <Link
                            href={getBlogListUrl({ page: page + 1, category })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
                        >
                            Older posts
                            <ArrowRight className="size-4" aria-hidden />
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </div>
    );
}

function CategoriesSkeleton() {
    return (
        <div aria-hidden className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full" />
            ))}
        </div>
    );
}

function PostsSkeleton({ featured }: { featured: boolean }) {
    return (
        <div className="flex flex-col gap-10">
            {featured && <Skeleton aria-hidden className="aspect-3/2 w-full rounded-[10px] md:aspect-[5/2]" />}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {[1, 2, 3].map((i) => (
                    <PostCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
