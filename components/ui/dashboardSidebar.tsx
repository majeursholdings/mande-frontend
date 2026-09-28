"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoLink from "@/components/ui/logoLink";

export type SidebarItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
    /** A count after the label, e.g. what's waiting there. Nothing at 0. */
    badge?: number;
};

/**
 * A sidebar row — full width, tinted on hover. For a platform's Logout too
 * (a link on one, a confirm-first button on the other), with
 * SIDEBAR_ROW_IDLE_CLASS.
 */
export const SIDEBAR_ROW_CLASS =
    "relative flex w-full items-center gap-3 px-7 py-2.5 text-sm font-medium font-text transition-colors duration-200 cursor-pointer";

export const SIDEBAR_ROW_IDLE_CLASS = "text-mist-600 hover:bg-mist-50 hover:text-mist-900";

// The page you're on: tinted, with a red bar on its left edge
const SIDEBAR_ROW_ACTIVE_CLASS =
    "bg-secondary-50 text-secondary-700 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-secondary-700";

// ─────────────────────────────────────────────────────────────────────────────
// SidebarContent — the dashboard nav, the same on both platforms: the logo,
// the sections, and at the bottom Logout and which platform this is. In the
// desktop sidebar (DashboardSidebar), and the admin's phone Menu drawer.
// ─────────────────────────────────────────────────────────────────────────────

export function SidebarContent({
    homeHref,
    items,
    logout,
    platformName,
    onNavigate,
}: {
    /** Where the logo goes — the platform's dashboard. */
    homeHref: string;
    items: SidebarItem[];
    /** The Logout row, in SIDEBAR_ROW_CLASS. */
    logout: ReactNode;
    /** e.g. "Admin platform". */
    platformName: string;
    /** A section was picked — e.g. to close the drawer it's in. */
    onNavigate?: () => void;
}) {
    return (
        <div className="flex min-h-full flex-col justify-between gap-8 py-6">
            <div className="flex flex-col gap-8">
                <div className="px-6">
                    <LogoLink href={homeHref} onClick={onNavigate} className="max-w-30" />
                </div>

                <nav className="flex flex-col gap-1">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={item.isActive ? "page" : undefined}
                            className={cn(
                                SIDEBAR_ROW_CLASS,
                                item.isActive ? SIDEBAR_ROW_ACTIVE_CLASS : SIDEBAR_ROW_IDLE_CLASS,
                            )}
                        >
                            <item.icon className="size-5 shrink-0" strokeWidth={1.75} />
                            {item.label}
                            {!!item.badge && (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-600 px-1.5 text-[11px] font-semibold text-white tabular-nums">
                                    {item.badge}
                                    <span className="sr-only"> waiting</span>
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex flex-col gap-4">
                {logout}
                <p className="mx-6 border-t border-border pt-4 text-xs font-medium font-text uppercase tracking-wide text-primary-700">
                    {platformName}
                </p>
            </div>
        </div>
    );
}

/** The desktop sidebar, around a platform's SidebarContent — from lg up; phones have a bottom bar instead. */
export default function DashboardSidebar({ children }: { children: ReactNode }) {
    return (
        <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 overflow-y-auto border-r border-border bg-white lg:block">
            {children}
        </aside>
    );
}
