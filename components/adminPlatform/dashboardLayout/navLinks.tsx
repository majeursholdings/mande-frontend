"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
    type SidebarItem,
} from "@/components/ui/dashboardSidebar";
import type { AdminNavItem } from "@/constant/admin";
import { useStaffActionsCount } from "./useStaffActionsCount";
import SidebarRank from "@/components/common/points/sidebarRank";
import { useLogout } from "./logoutContext";
import { isStaffNavItemActive, useStaffPlatform } from "./staffPlatformContext";

/**
 * The staff platform's nav in the shared sidebar layout — the desktop sidebar
 * and the phone's Menu drawer. Logout asks to confirm first.
 */
export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const platform = useStaffPlatform();
    const { requestLogout } = useLogout();
    const pendingActionCount = useStaffActionsCount();
    const toSidebarItem = (item: AdminNavItem): SidebarItem => ({
        label: item.label,
        href: item.href,
        icon: item.icon,
        isActive: isStaffNavItemActive(platform, item, pathname),
        badge: item.countsPendingActions ? pendingActionCount : undefined,
        children: item.children?.map(toSidebarItem),
    });

    return (
        <SidebarContent
            homeHref={platform.dashboardUrl}
            platformName={platform.name}
            // A project lead's present rank (super admins have none)
            standing={platform.leadId ? <SidebarRank role="admin" /> : undefined}
            onNavigate={onNavigate}
            items={platform.navItems.map(toSidebarItem)}
            logout={
                <button
                    type="button"
                    onClick={() => {
                        onNavigate?.();
                        requestLogout();
                    }}
                    className={cn(SIDEBAR_ROW_CLASS, SIDEBAR_ROW_IDLE_CLASS)}
                >
                    <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                    Logout
                </button>
            }
        />
    );
}
