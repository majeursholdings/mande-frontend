import { decodeRouteParam } from "@/lib/utils";
import AdminManufacturerDetailPage from "@/components/adminPlatform/manufacturerDetailPage";

export default async function AdminManufacturerRoute({ params }: { params: Promise<{ manufacturerId: string }> }) {
    const { manufacturerId } = await params;
    return <AdminManufacturerDetailPage manufacturerId={decodeRouteParam(manufacturerId)} />;
}
