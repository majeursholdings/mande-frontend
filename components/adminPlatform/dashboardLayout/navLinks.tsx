"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
} from "@/components/ui/dashboardSidebar";
import { useSuperAdminActions } from "@/components/superAdminPlatform/actions/pendingActions";
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
    const pendingActionCount = useSuperAdminActions().length;

    return (
        <SidebarContent
            homeHref={platform.dashboardUrl}
            platformName={platform.name}
            onNavigate={onNavigate}
            items={platform.navItems.map((item) => ({
                label: item.label,
                href: item.href,
                icon: item.icon,
                isActive: isStaffNavItemActive(platform, item, pathname),
                badge: item.countsPendingActions ? pendingActionCount : undefined,
            }))}
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
