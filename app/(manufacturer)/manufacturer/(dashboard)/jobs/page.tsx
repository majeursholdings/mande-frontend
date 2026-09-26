import ManufacturerJobsPage from "@/components/manufacturerPlatform/jobsPage";

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { tab } = await searchParams;
    return <ManufacturerJobsPage initialTab={tab === "active" ? "active" : "open"} />;
}
