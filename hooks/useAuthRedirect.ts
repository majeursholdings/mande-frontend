"use client";

import { redirect } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { ADMIN_DASHBOARD_URL } from "@/constant/admin";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import { SUPER_ADMIN_DASHBOARD_URL } from "@/constant/navigation";

export function getDashboardUrlForRole(role?: string): string {
    switch (role) {
        case "super_admin":
            return SUPER_ADMIN_DASHBOARD_URL;
        case "admin":
            return ADMIN_DASHBOARD_URL;
        case "manufacturer":
            return MANUFACTURER_DASHBOARD_URL;
        default:
            return "/";
    }
}

/**
 * Sends a signed-in visitor on to their dashboard. `enabled: false` holds off,
 * e.g. while a sign-up that signs them in part way through is still going.
 */
export function useRedirectIfAuthenticated({ enabled = true }: { enabled?: boolean } = {}) {
    const { data: currentUser, isPending } = useCurrentUser();

    if (enabled && !isPending && currentUser && currentUser.status === "active") {
        let destination = getDashboardUrlForRole(currentUser.role);
        if (typeof window !== "undefined") {
            const next = new URLSearchParams(window.location.search).get("next");
            const rolePrefix =
                currentUser.role === "super_admin"
                    ? "/super-admin/"
                    : currentUser.role === "admin"
                      ? "/admin/"
                      : "/manufacturer/";
            if (next && next.startsWith(rolePrefix) && !next.startsWith("//") && !next.includes("\\")) {
                destination = next;
            }
        }
        redirect(destination);
    }

    return { isCheckingAuth: isPending, currentUser };
}
