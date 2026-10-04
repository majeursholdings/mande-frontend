import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getWebsiteOpenJobs } from "@/lib/services/websiteService";
import { getBlogSlugs } from "@/lib/cms/blog";
import { getKnowledgeBaseSlugs } from "@/lib/cms/knowledgeBase";
import { getLegalDocuments } from "@/lib/cms/legal";
import { BLOG_URL, KNOWLEDGE_BASE_URL, LEGALS_URL, getBlogPostUrl, getKnowledgeBaseArticleUrl, getLegalDocumentUrl } from "@/constant/navigation";

/** The public website's pages. */
const PUBLIC_PATHS = [
    "",
    "/about-mande",
    "/mande-services",
    "/open-jobs",
    "/community",
    "/faq",
    KNOWLEDGE_BASE_URL,
    BLOG_URL,
    "/contact-mande",
    "/legals",
    "/privacy-policy",
    "/terms-and-conditions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => ({
        url: `${SITE_URL}${path}`,
        changeFrequency: path === "/open-jobs" ? "daily" : "monthly",
        priority: path === "" ? 1 : path === "/open-jobs" ? 0.8 : 0.5,
    }));
    // Each open job's own page (the API down leaves just the pages above)
    const jobs: MetadataRoute.Sitemap = ((await getWebsiteOpenJobs()) ?? []).map((job) => ({
        url: `${SITE_URL}/open-jobs/${job.id}`,
        lastModified: job.postedAt,
        changeFrequency: "daily",
        priority: 0.7,
    }));
    // The CMS's pages (the CMS down leaves them out)
    const [articles, posts, legalDocuments] = await Promise.all([
        getKnowledgeBaseSlugs().catch(() => []),
        getBlogSlugs().catch(() => []),
        getLegalDocuments().catch(() => []),
    ]);
    const cms: MetadataRoute.Sitemap = [
        ...articles.map(({ slug, updatedAt }) => ({
            url: `${SITE_URL}${getKnowledgeBaseArticleUrl(slug)}`,
            lastModified: updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        })),
        ...posts.map(({ slug, updatedAt }) => ({
            url: `${SITE_URL}${getBlogPostUrl(slug)}`,
            lastModified: updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        })),
        // The terms and privacy policy are listed above at their own addresses
        ...legalDocuments
            .filter(({ slug }) => getLegalDocumentUrl(slug).startsWith(`${LEGALS_URL}/`))
            .map(({ slug, updatedAt }) => ({
                url: `${SITE_URL}${getLegalDocumentUrl(slug)}`,
                lastModified: updatedAt,
                changeFrequency: "yearly" as const,
                priority: 0.3,
            })),
    ];
    return [...pages, ...jobs, ...cms];
}
