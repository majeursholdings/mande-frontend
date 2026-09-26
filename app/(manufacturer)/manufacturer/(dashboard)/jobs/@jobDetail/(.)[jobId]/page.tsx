import JobDetailSheet from "@/components/manufacturerPlatform/jobDetailPage/jobDetailSheet";

export default async function InterceptedJobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;
    return <JobDetailSheet jobId={jobId} />;
}
