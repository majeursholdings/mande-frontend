import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OpenJobPage from "@/components/mainWebsite/openJobPage";
import { OPEN_JOBS_URL } from "@/constant/navigation";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getWebsiteOpenJob } from "@/lib/services/websiteService";

type Props = { params: Promise<{ jobId: string }> };

/** A short description for search results and shared links: the start of the job's own. */
const summarize = (text: string) => (text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { jobId } = await params;
    const job = await getWebsiteOpenJob(jobId);
    if (!job) return { title: "Job not found | MANDE", robots: { index: false } };
    return pageMetadata({ title: `${job.title} | MANDE`, description: summarize(job.description), path: `${OPEN_JOBS_URL}/${job.id}` });
}

// A job that's no longer open (taken, closed) is a 404, so it drops out of search
export default async function OpenJobRoute({ params }: Props) {
    const { jobId } = await params;
    const job = await getWebsiteOpenJob(jobId);
    if (!job) notFound();
    return <OpenJobPage job={job} url={`${SITE_URL}${OPEN_JOBS_URL}/${job.id}`} />;
}
