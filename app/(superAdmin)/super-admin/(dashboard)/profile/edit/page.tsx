import AdminSettingsPage from "@/components/adminPlatform/settingsPage";

export default async function SuperAdminEditProfileRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { tab } = await searchParams;
    return <AdminSettingsPage initialTab={typeof tab === "string" ? tab : undefined} />;
}
