import { decodeRouteParam } from "@/lib/utils";
import ProjectLeadDetailPage from "@/components/superAdminPlatform/projectLeadDetailPage";

export default async function SuperAdminProjectLeadDetailRoute({
    params,
}: {
    params: Promise<{ leadId: string }>;
}) {
    const { leadId } = await params;
    return <ProjectLeadDetailPage leadId={decodeRouteParam(leadId)} />;
}
