"use client";

import { usePathname } from "next/navigation";
import { Ellipsis, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardFrame from "@/components/ui/dashboardFrame";
import SharedSidebar, {
    SIDEBAR_ROW_CLASS,
    SIDEBAR_ROW_IDLE_CLASS,
    SidebarContent,
} from "@/components/ui/dashboardSidebar";
import LogoLink from "@/components/ui/logoLink";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BellIcon,
    DESKTOP_BELL_CLASS,
    DESKTOP_TOPBAR_CLASS,
    DESKTOP_USER_CARD_CLASS,
    MOBILE_TOPBAR_CLASS,
} from "@/components/ui/topbarControls";
import { isStaffNavItemActive, useStaffPlatform } from "./staffPlatformContext";

const TAB_CLASS =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium font-text transition-colors duration-200";

/**
 * The staff dashboard while SessionGuard checks who's signed in: the frame,
 * nav and bell as they'll be, with the signed-in person's name and photo
 * and the page itself as skeletons, so there's no blank screen or spinner.
 * Nothing here reads their data, which only loads once they're confirmed.
 */
export default function DashboardShellSkeleton() {
    const pathname = usePathname();
    const platform = useStaffPlatform();

    return (
        <DashboardFrame
            sidebar={
                <SharedSidebar>
                    <SidebarContent
                        homeHref={platform.dashboardUrl}
                        platformName={platform.name}
                        items={platform.navItems.map((item) => ({
                            label: item.label,
                            href: item.href,
                            icon: item.icon,
                            isActive: isStaffNavItemActive(platform, item, pathname),
                        }))}
                        logout={
                            <button type="button" disabled className={cn(SIDEBAR_ROW_CLASS, SIDEBAR_ROW_IDLE_CLASS)}>
                                <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                                Logout
                            </button>
                        }
                    />
                </SharedSidebar>
            }
            desktopTopbar={
                <header className={cn(DESKTOP_TOPBAR_CLASS, "justify-end gap-4 px-8")}>
                    <span className={DESKTOP_BELL_CLASS} aria-hidden>
                        <BellIcon hasUnread={false} />
                    </span>
                    <span className={DESKTOP_USER_CARD_CLASS} aria-hidden>
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </span>
                </header>
            }
            mobileTopbar={
                <header className={MOBILE_TOPBAR_CLASS}>
                    <LogoLink href={platform.dashboardUrl} className="w-25" />
                    <div className="flex items-center gap-4">
                        <span className="relative" aria-hidden>
                            <BellIcon hasUnread={false} size="sm" />
                        </span>
                        <Skeleton className="size-8 rounded-full" />
                    </div>
                </header>
            }
            bottomNav={
                <nav className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-bottom-nav-height) items-stretch border-t border-border bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
                    {platform.navItems
                        .filter((item) => item.inBottomBar)
                        .map((item) => (
                            <span
                                key={item.href}
                                className={cn(
                                    TAB_CLASS,
                                    isStaffNavItemActive(platform, item, pathname) ? "text-secondary-700" : "text-mist-500",
                                )}
                            >
                                <item.icon className="size-6" strokeWidth={1.5} />
                                <span className="whitespace-nowrap">{item.shortLabel ?? item.label}</span>
                            </span>
                        ))}
                    <span className={cn(TAB_CLASS, "text-mist-500")}>
                        <Ellipsis className="size-6" strokeWidth={1.5} />
                        Menu
                    </span>
                </nav>
            }
        >
            <div className="flex flex-col gap-6" role="status" aria-busy="true">
                <span className="sr-only">Checking you&apos;re signed in</span>
                <Skeleton className="h-8 w-48" />
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        </DashboardFrame>
    );
}
