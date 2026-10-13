import { decodeRouteParam } from "@/lib/utils";
import MachineBookingDetailPage from "@/components/adminPlatform/machineBookingDetailPage";

export default async function SuperAdminMachineBookingRoute({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = await params;
    return <MachineBookingDetailPage bookingId={decodeRouteParam(bookingId)} />;
}
