import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatOrdinalDate } from "@/lib/date";
import { cmsImageUrl } from "@/lib/cms/client";
import type { BlogPost } from "@/lib/cms/blog";
import { getReadingMinutes } from "@/lib/cms/richText";
import { RichText } from "@/components/common/richText";
import { BLOG_URL } from "@/constant/navigation";
import SectionWrapper from "../common/sectionWrapper";
import PostCard from "./postCard";

// ─────────────────────────────────────────────────────────────────────────────
// A blog post — category, title and excerpt, who wrote it and when, the cover
// picture, the text in a reading-width column, then the latest other posts.
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogPostView({ post }: { post: BlogPost }) {
    const author = post.author;
    return (
        <>
            <section className="bg-mist-200 px-2.5 pt-12.5 pb-24 md:pt-16 md:pb-40">
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                    <Link
                        href={post.category ? `${BLOG_URL}?category=${post.category.slug}` : BLOG_URL}
                        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary-800 hover:text-primary-950"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        {post.category?.title ?? "Blog"}
                    </Link>
                    <h1 className="text-3xl tracking-tight text-pretty md:text-5xl">{post.title}</h1>
                    <p className="text-base font-light md:text-lg">{post.excerpt}</p>
                    <div className="mt-2 flex items-center gap-3">
                        {author?.image?.asset && (
                            <Image
                                src={cmsImageUrl(author.image).width(96).height(96).fit("crop").url()}
                                alt=""
                                width={44}
                                height={44}
                                className="size-11 rounded-full object-cover"
                            />
                        )}
                        <div className="flex flex-col text-sm">
                            {author && (
                                <span className="font-medium">
                                    {author.name}
                                    {author.role && <span className="font-light text-mist-700">, {author.role}</span>}
                                </span>
                            )}
                            <span className="font-light text-mist-700">
                                <time dateTime={post.publishedAt}>{formatOrdinalDate(new Date(post.publishedAt))}</time>
                                {" · "}
                                {getReadingMinutes(post.body)} min read
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {post.coverImage?.asset && (
                <div className="-mt-16 px-2.5 md:-mt-28">
                    <Image
                        src={cmsImageUrl(post.coverImage).width(1600).height(900).fit("crop").url()}
                        alt={post.coverImage.alt ?? ""}
                        width={1600}
                        height={900}
                        sizes="(min-width: 1024px) 1024px, 100vw"
                        priority
                        placeholder={post.coverImage.lqip ? "blur" : "empty"}
                        blurDataURL={post.coverImage.lqip ?? undefined}
                        className="mx-auto aspect-video w-full max-w-5xl rounded-[10px] object-cover"
                    />
                </div>
            )}

            <SectionWrapper className="md:py-16" containerClassName="max-w-3xl">
                <RichText value={post.body} />
            </SectionWrapper>

            {post.more.length > 0 && (
                <SectionWrapper className="border-t border-border" containerClassName="flex flex-col gap-6">
                    <h2 className="text-2xl tracking-tight md:text-3xl">More from the blog</h2>
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {post.more.map((other) => (
                            <li key={other.slug}>
                                <PostCard post={other} />
                            </li>
                        ))}
                    </ul>
                </SectionWrapper>
            )}
        </>
    );
}
