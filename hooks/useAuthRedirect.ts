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
 * When a browser has a valid token and visits a login or sign-up page,
 * redirect them immediately to their respective dashboard page.
 */
export function useRedirectIfAuthenticated() {
    const { data: currentUser, isPending } = useCurrentUser();

    if (!isPending && currentUser && currentUser.status === "active") {
        const destination = getDashboardUrlForRole(currentUser.role);
        redirect(destination);
    }

    return { isCheckingAuth: isPending, currentUser };
}
