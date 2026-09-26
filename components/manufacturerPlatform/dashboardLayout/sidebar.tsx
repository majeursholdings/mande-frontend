"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANUFACTURER_NAV_ITEMS, MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";
import { BlackLogo } from "@/components/mainWebsite/navigations/logo";

export default function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden h-dvh stick top-0 left-0 overflow-hidden lg:flex lg:w-62 shrink-0 flex-col justify-between border-r border-border bg-white px-4 py-6">
            <div className="flex flex-col gap-8">
                <div className="px-2 max-w-30">
                    <BlackLogo/>
                </div>

                <nav className="flex flex-col gap-1">
                    {MANUFACTURER_NAV_ITEMS.map((item) => {
                        const isActive =
                            item.href === MANUFACTURER_DASHBOARD_URL
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium font-text transition-colors duration-200",
                                    isActive
                                        ? "bg-secondary-50 text-secondary-700"
                                        : "text-mist-600 hover:bg-mist-50 hover:text-mist-900",
                                )}
                            >
                                <item.icon className="size-5 shrink-0" strokeWidth={1.75} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <Link
                href={ARTISAN_LOGIN_URL}
                title="Logout"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium font-text text-mist-600 hover:bg-mist-50 hover:text-mist-900 transition-colors duration-200"
            >
                <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                Logout
            </Link>
        </aside>
    );
}
