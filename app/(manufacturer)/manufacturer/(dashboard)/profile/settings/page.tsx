import ManufacturerSettingsPage from "@/components/manufacturerPlatform/settingsPage";

export default async function ManufacturerSettingsRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { tab } = await searchParams;
    return <ManufacturerSettingsPage initialTab={typeof tab === "string" ? tab : undefined} />;
}
