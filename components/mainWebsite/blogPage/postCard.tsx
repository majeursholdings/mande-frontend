import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import { cmsImageUrl } from "@/lib/cms/client";
import type { BlogPostSummary } from "@/lib/cms/blog";
import { getBlogPostUrl } from "@/constant/navigation";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A post in the blog's lists: its cover, category and date, title and
 * excerpt. `featured` lays it out wide, picture beside the text, from md.
 */
export default function PostCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
    return (
        <Link
            href={getBlogPostUrl(post.slug)}
            className={cn(
                "group flex h-full flex-col overflow-hidden rounded-[10px] border border-border bg-white transition-colors duration-300 hover:border-primary-300",
                featured && "md:flex-row",
            )}
        >
            <div className={cn("relative aspect-3/2 shrink-0 overflow-hidden bg-mist-200", featured && "md:aspect-auto md:w-3/5")}>
                {post.coverImage?.asset && (
                    <Image
                        src={cmsImageUrl(post.coverImage).width(1200).height(800).fit("crop").url()}
                        alt={post.coverImage.alt ?? ""}
                        fill
                        sizes={featured ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                        placeholder={post.coverImage.lqip ? "blur" : "empty"}
                        blurDataURL={post.coverImage.lqip ?? undefined}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                )}
            </div>
            <div className={cn("flex flex-1 flex-col gap-3 p-5 lg:p-6", featured && "md:justify-center lg:p-10")}>
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-light text-mist-600">
                    {post.category && <span className="font-medium text-primary-800">{post.category.title}</span>}
                    {post.category && <span aria-hidden>·</span>}
                    <time dateTime={post.publishedAt}>{formatOrdinalDate(new Date(post.publishedAt))}</time>
                </p>
                <h3 className={cn("font-medium text-pretty", featured ? "text-2xl tracking-tight md:text-3xl" : "text-xl")}>
                    {post.title}
                </h3>
                <p className="line-clamp-3 text-base font-light text-mist-700">{post.excerpt}</p>
            </div>
        </Link>
    );
}

export function PostCardSkeleton() {
    return (
        <div aria-hidden className="flex h-full flex-col overflow-hidden rounded-[10px] border border-border bg-white">
            <Skeleton className="aspect-3/2 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-5 lg:p-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    );
}
