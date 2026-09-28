import SuperAdminSettingsPage from "@/components/superAdminPlatform/settingsPage";

export default async function SuperAdminSettingsRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { tab } = await searchParams;
    return <SuperAdminSettingsPage initialTab={typeof tab === "string" ? tab : undefined} />;
}
