import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getWebsiteOpenJobs } from "@/lib/services/websiteService";

/** The public website's pages. */
const PUBLIC_PATHS = [
    "",
    "/about-mande",
    "/mande-services",
    "/open-jobs",
    "/community",
    "/faq",
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
    return [...pages, ...jobs];
}
