import AdminJobsPage from "@/components/adminPlatform/jobsPage";

export default async function AdminJobsRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // ?job=<id> opens that job's panel — e.g. from the dashboard's Review buttons
    const { job } = await searchParams;
    return <AdminJobsPage initialJobId={typeof job === "string" ? job : undefined} />;
}
