import AdminJobsPage from "@/components/adminPlatform/jobsPage";

// The admin's Jobs page — every job's lead actions, and deleting a job no one's been paid for
export default async function SuperAdminJobsRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // ?job=<id> opens that job's panel
    const { job } = await searchParams;
    return <AdminJobsPage initialJobId={typeof job === "string" ? job : undefined} />;
}
