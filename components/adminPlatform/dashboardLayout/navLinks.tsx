"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
} from "@/components/ui/dashboardSidebar";
import { ADMIN_DASHBOARD_URL, ADMIN_NAV_ITEMS, isAdminNavItemActive } from "@/constant/admin";
import { useLogout } from "./logoutContext";

/**
 * The admin's nav in the shared sidebar layout — the desktop sidebar and the
 * phone's Menu drawer. Logout asks to confirm first.
 */
export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { requestLogout } = useLogout();

    return (
        <SidebarContent
            homeHref={ADMIN_DASHBOARD_URL}
            platformName="Admin platform"
            onNavigate={onNavigate}
            items={ADMIN_NAV_ITEMS.map((item) => ({
                label: item.label,
                href: item.href,
                icon: item.icon,
                isActive: isAdminNavItemActive(item, pathname),
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
