import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostView from "@/components/mainWebsite/blogPage/postView";
import { cmsImageUrl } from "@/lib/cms/client";
import { getBlogPost, getBlogSlugs } from "@/lib/cms/blog";
import { getBlogPostUrl } from "@/constant/navigation";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

// Built ahead for the posts in the CMS when the site is built; one published
// later is built on its first visit, and an unknown slug is a 404
export async function generateStaticParams() {
    const posts = await getBlogSlugs().catch(() => []);
    return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPost(slug).catch(() => null);
    if (!post) return {};

    const metadata = pageMetadata({ title: `${post.title} | MANDE`, description: post.excerpt, path: getBlogPostUrl(slug) });
    if (!post.coverImage?.asset) return metadata;
    // Shared links show the post's cover rather than the site's picture
    const image = {
        url: cmsImageUrl(post.coverImage).width(1200).height(630).fit("crop").url(),
        width: 1200,
        height: 630,
        alt: post.coverImage.alt,
    };
    return {
        ...metadata,
        openGraph: { ...metadata.openGraph, type: "article", publishedTime: post.publishedAt, images: [image] },
        twitter: { ...metadata.twitter, images: [image] },
    };
}

export default async function BlogPostRoute({ params }: Props) {
    const post = await getBlogPost((await params).slug);
    if (!post) notFound();
    return <BlogPostView post={post} />;
}
