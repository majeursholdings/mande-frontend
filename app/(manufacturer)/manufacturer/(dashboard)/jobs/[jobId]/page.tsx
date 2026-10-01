import StandaloneJobDetailView from "@/components/manufacturerPlatform/jobDetailPage/standaloneJobDetailView";

export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;
    return <StandaloneJobDetailView jobId={jobId} />;
}
