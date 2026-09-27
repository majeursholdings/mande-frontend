"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import SharedSidebar, {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
} from "@/components/ui/dashboardSidebar";
import { MANUFACTURER_NAV_ITEMS, MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";

/** The manufacturer's desktop nav, in the shared sidebar layout — from lg up. */
export default function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <SharedSidebar>
            <SidebarContent
                homeHref={MANUFACTURER_DASHBOARD_URL}
                platformName="Manufacturer platform"
                items={MANUFACTURER_NAV_ITEMS.map((item) => ({
                    label: item.label,
                    href: item.href,
                    icon: item.icon,
                    isActive:
                        item.href === MANUFACTURER_DASHBOARD_URL ? pathname === item.href : pathname.startsWith(item.href),
                }))}
                logout={
                    <Link href={ARTISAN_LOGIN_URL} className={cn(SIDEBAR_ROW_CLASS, SIDEBAR_ROW_IDLE_CLASS)}>
                        <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                        Logout
                    </Link>
                }
            />
        </SharedSidebar>
    );
}
