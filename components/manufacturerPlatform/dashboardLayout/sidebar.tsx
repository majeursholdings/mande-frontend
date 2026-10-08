"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SharedSidebar, {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
} from "@/components/ui/dashboardSidebar";
import { MANUFACTURER_NAV_ITEMS, MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import SidebarRank from "@/components/common/points/sidebarRank";
import { useLogout } from "./logoutContext";

/** The manufacturer's desktop nav, in the shared sidebar layout — from lg up. */
export default function DashboardSidebar() {
    const pathname = usePathname();
    const { requestLogout } = useLogout();

    return (
        <SharedSidebar>
            <SidebarContent
                homeHref={MANUFACTURER_DASHBOARD_URL}
                platformName="Manufacturer platform"
                standing={<SidebarRank role="manufacturer" />}
                items={MANUFACTURER_NAV_ITEMS.map((item) => ({
                    label: item.label,
                    href: item.href,
                    icon: item.icon,
                    isActive:
                        item.href === MANUFACTURER_DASHBOARD_URL ? pathname === item.href : pathname.startsWith(item.href),
                }))}
                logout={
                    <button
                        type="button"
                        onClick={requestLogout}
                        className={cn(SIDEBAR_ROW_CLASS, SIDEBAR_ROW_IDLE_CLASS, "w-full text-left cursor-pointer")}
                    >
                        <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                        Logout
                    </button>
                }
            />
        </SharedSidebar>
    );
}
