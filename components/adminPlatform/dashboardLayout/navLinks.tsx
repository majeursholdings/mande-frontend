"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from "@/constant/admin";
import { useLogout } from "./logoutContext";

const ROW_CLASS =
    "relative flex w-full items-center gap-3 px-10 py-3 text-sm font-medium font-text transition-colors duration-200 cursor-pointer";

/**
 * The full nav as edge-to-edge rows, then Logout at the bottom — the desktop
 * sidebar and the mobile menu drawer. The active row gets a tint and a red
 * bar on its left edge.
 */
export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { requestLogout } = useLogout();

    return (
        <div className="flex flex-1 flex-col justify-between">
            <nav className="flex flex-col">
                {ADMIN_NAV_ITEMS.map((item) => {
                    const isActive = isAdminNavItemActive(item, pathname);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                ROW_CLASS,
                                isActive
                                    ? "bg-secondary-50 text-secondary-700 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-secondary-700"
                                    : "text-mist-600 hover:bg-mist-50 hover:text-mist-900",
                            )}
                        >
                            <item.icon className="size-5 shrink-0" strokeWidth={1.75} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <button
                type="button"
                onClick={() => {
                    onNavigate?.();
                    requestLogout();
                }}
                className={cn(ROW_CLASS, "text-mist-600 hover:bg-mist-50 hover:text-mist-900")}
            >
                <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                Logout
            </button>
        </div>
    );
}
