import AdminManufacturerDetailPage from "@/components/adminPlatform/manufacturerDetailPage";

export default async function SuperAdminManufacturerRoute({ params }: { params: Promise<{ manufacturerId: string }> }) {
    const { manufacturerId } = await params;
    return <AdminManufacturerDetailPage manufacturerId={manufacturerId} />;
}
