"use client";

import { useLeadActions } from "@/components/adminPlatform/actionsPage";
import { useSuperAdminActions } from "@/components/superAdminPlatform/actions/pendingActions";
import { useStaffPlatform } from "./staffPlatformContext";

/**
 * How many things are waiting on the signed-in staff member, for the count
 * beside Actions in the menu: a super admin's queue on their platform, the
 * project lead's on the admin platform.
 */
export function useStaffActionsCount(): number {
    const platform = useStaffPlatform();
    const isSuperAdmin = platform.key === "super-admin";
    const superAdminCount = useSuperAdminActions().length;
    const lead = useLeadActions(!isSuperAdmin);
    return isSuperAdmin ? superAdminCount : (lead.data?.counts.total ?? 0);
}
