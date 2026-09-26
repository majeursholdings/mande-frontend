"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MANUFACTURER_NAV_ITEMS, MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";

export default function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-border bg-white px-1 pb-[env(safe-area-inset-bottom)]">
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
                            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium font-text transition-colors duration-200",
                            isActive ? "text-secondary-700" : "text-mist-400",
                        )}
                    >
                        <item.icon className="size-5" strokeWidth={1.75} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
