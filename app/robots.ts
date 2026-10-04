import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public website is crawlable. The platforms' pages carry a noindex tag
// instead of being disallowed here: a crawler has to load a page to see it.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/" },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
