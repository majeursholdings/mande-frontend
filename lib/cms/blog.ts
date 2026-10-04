// ─────────────────────────────────────────────────────────────────────────────
// The blog: posts from the CMS ("blogPost"), newest first, with their author
// and category. A post with a publish date still to come stays hidden.
// ─────────────────────────────────────────────────────────────────────────────

import { CMS_IMAGE_FIELDS, cmsFetch, type CmsImage } from "./client";
import { RICH_TEXT_FIELDS, type RichText } from "./richText";

/** Posts on each page of the blog. */
export const BLOG_PAGE_SIZE = 9;

export type BlogCategory = { slug: string; title: string };

export type BlogAuthor = { name: string; role: string | null; image: CmsImage | null };

export type BlogPostSummary = {
    slug: string;
    title: string;
    excerpt: string;
    /** ISO date. */
    publishedAt: string;
    coverImage: CmsImage | null;
    category: BlogCategory | null;
};

export type BlogPost = BlogPostSummary & {
    author: BlogAuthor | null;
    body: RichText;
    /** The latest other posts, for "More from the blog". */
    more: BlogPostSummary[];
};

const POST = `_type == "blogPost" && defined(slug.current) && publishedAt <= now()`;
const SUMMARY_FIELDS = `
    "slug": slug.current,
    title,
    excerpt,
    publishedAt,
    coverImage{ ${CMS_IMAGE_FIELDS} },
    "category": category->{ "slug": slug.current, title }
`;

/** The categories that have at least one post, A to Z. */
export function getBlogCategories(): Promise<BlogCategory[]> {
    return cmsFetch(
        `*[_type == "blogCategory" && defined(slug.current) && count(*[${POST} && category._ref == ^._id]) > 0]
            | order(title asc) { "slug": slug.current, title }`,
    );
}

/** One page of posts (from 1), optionally in one category, and how many there are in all. */
export function getBlogPosts({
    page,
    category,
}: {
    page: number;
    category?: string;
}): Promise<{ posts: BlogPostSummary[]; total: number }> {
    // GROQ slices can't take parameters, so the bounds go in the query as whole numbers
    const start = (Math.max(1, Math.floor(page)) - 1) * BLOG_PAGE_SIZE;
    const filter = category ? `${POST} && category->slug.current == $category` : POST;
    return cmsFetch(
        `{
            "posts": *[${filter}] | order(publishedAt desc) [${start}...${start + BLOG_PAGE_SIZE}] { ${SUMMARY_FIELDS} },
            "total": count(*[${filter}])
        }`,
        category ? { category } : {},
    );
}

/** One post with its text, or null when there's none (or it isn't published yet). */
export function getBlogPost(slug: string): Promise<BlogPost | null> {
    return cmsFetch(
        `*[${POST} && slug.current == $slug][0] {
            ${SUMMARY_FIELDS},
            "author": author->{ name, role, image{ ${CMS_IMAGE_FIELDS}, "alt": ^.name } },
            ${RICH_TEXT_FIELDS},
            "more": *[${POST} && _id != ^._id] | order(publishedAt desc) [0...3] { ${SUMMARY_FIELDS} }
        }`,
        { slug },
    );
}

/** Every published post's slug and date, for building pages ahead and the sitemap. */
export function getBlogSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    return cmsFetch(`*[${POST}] { "slug": slug.current, "updatedAt": _updatedAt }`);
}
