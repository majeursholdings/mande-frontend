import { getJobCategoryLabel } from "@/constant/manufacturer";
import { SITE_URL } from "@/lib/site";
import { SITE_NAME } from "@/lib/seo";
import type { WebsiteJob } from "@/lib/services/websiteService";

/**
 * A job as schema.org JobPosting structured data, for Google's job search
 * (https://developers.google.com/search/docs/appearance/structured-data/job-posting).
 * Only for a single job's own page: Google ignores it on listing pages.
 *
 * MANDE jobs are paid as a fixed amount for the whole piece, which
 * baseSalary has no unit for (only hour, day, week, month or year), so the
 * pay is in the description rather than marked up.
 */
export function getJobPostingSchema(job: WebsiteJob, url: string) {
    const location = job.deliveryLocation;
    return {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        title: job.title,
        description: job.description,
        identifier: { "@type": "PropertyValue", name: SITE_NAME, value: job.code },
        datePosted: job.postedAt,
        employmentType: "CONTRACTOR",
        industry: "Furniture manufacturing",
        occupationalCategory: getJobCategoryLabel(job.category),
        hiringOrganization: {
            "@type": "Organization",
            name: SITE_NAME,
            sameAs: SITE_URL,
            logo: `${SITE_URL}/MANDE-logo.png`,
        },
        jobLocation: {
            "@type": "Place",
            address: {
                "@type": "PostalAddress",
                ...(location && { addressLocality: location.city, addressRegion: location.state }),
                addressCountry: "NG",
            },
        },
        // Applying is done on MANDE after creating a profile, not on this page
        directApply: false,
        url,
    };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so text from a job can't close the tag. */
export function toJsonLd(data: unknown): string {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}
