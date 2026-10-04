// ─────────────────────────────────────────────────────────────────────────────
// The knowledge base: help articles from the CMS ("knowledgeBaseArticle"),
// grouped in categories ("knowledgeBaseCategory").
// ─────────────────────────────────────────────────────────────────────────────

import { cmsFetch } from "./client";
import { RICH_TEXT_FIELDS, type RichText } from "./richText";

export type KnowledgeBaseArticleSummary = { slug: string; title: string; summary: string };

export type KnowledgeBaseCategory = {
    slug: string;
    title: string;
    description: string | null;
    articles: KnowledgeBaseArticleSummary[];
};

export type KnowledgeBaseSearchResult = KnowledgeBaseArticleSummary & { category: string | null };

export type KnowledgeBaseArticle = KnowledgeBaseArticleSummary & {
    /** ISO date of the last edit. */
    updatedAt: string;
    category: { slug: string; title: string } | null;
    body: RichText;
    /** The articles chosen as related, or else others from its category. */
    related: KnowledgeBaseArticleSummary[];
};

const ARTICLE = `_type == "knowledgeBaseArticle" && defined(slug.current)`;
const SUMMARY_FIELDS = `"slug": slug.current, title, summary`;

/** The categories in order, each with its articles. Categories with no articles are left out. */
export function getKnowledgeBaseCategories(): Promise<KnowledgeBaseCategory[]> {
    return cmsFetch(
        `*[_type == "knowledgeBaseCategory" && defined(slug.current)] | order(order asc, title asc) {
            "slug": slug.current,
            title,
            description,
            "articles": *[${ARTICLE} && category._ref == ^._id] | order(order asc, title asc) { ${SUMMARY_FIELDS} }
        }[count(articles) > 0]`,
    );
}

/** The most relevant articles for what someone typed, best first. */
export function searchKnowledgeBase(text: string): Promise<KnowledgeBaseSearchResult[]> {
    // Each word matches as a prefix ("withdr" finds "withdrawal")
    const terms = text
        .split(/\s+/)
        .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
        .filter(Boolean)
        .map((word) => `${word}*`);
    if (terms.length === 0) return Promise.resolve([]);

    return cmsFetch(
        `*[${ARTICLE} && [title, summary, pt::text(body)] match $terms]
            | score(boost(title match $terms, 3), boost(summary match $terms, 2), pt::text(body) match $terms)
            | order(_score desc) [0...20] { ${SUMMARY_FIELDS}, "category": category->title }`,
        { terms },
    );
}

/** One article with its text, or null when there's none with that slug. */
export function getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
    return cmsFetch(
        `*[${ARTICLE} && slug.current == $slug][0] {
            ${SUMMARY_FIELDS},
            "updatedAt": _updatedAt,
            "category": category->{ "slug": slug.current, title },
            ${RICH_TEXT_FIELDS},
            "related": select(
                count(relatedArticles[@->slug.current != null]) > 0 =>
                    relatedArticles[@->slug.current != null]->{ ${SUMMARY_FIELDS} },
                *[${ARTICLE} && category._ref == ^.category._ref && _id != ^._id]
                    | order(order asc, title asc) [0...3] { ${SUMMARY_FIELDS} }
            )
        }`,
        { slug },
    );
}

/** Every article's slug and last edit, for building pages ahead and the sitemap. */
export function getKnowledgeBaseSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    return cmsFetch(`*[${ARTICLE}] { "slug": slug.current, "updatedAt": _updatedAt }`);
}
