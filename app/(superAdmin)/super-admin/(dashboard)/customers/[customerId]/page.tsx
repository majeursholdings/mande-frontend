import { decodeRouteParam } from "@/lib/utils";
import CustomerDetailPage from "@/components/superAdminPlatform/customerDetailPage";

export default async function SuperAdminCustomerRoute({ params }: { params: Promise<{ customerId: string }> }) {
    const { customerId } = await params;
    return <CustomerDetailPage customerId={decodeRouteParam(customerId)} />;
}
