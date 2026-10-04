"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardFrame from "@/components/ui/dashboardFrame";
import LogoLink from "@/components/ui/logoLink";
import { DESKTOP_TOPBAR_CLASS, MOBILE_TOPBAR_CLASS } from "@/components/ui/topbarControls";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import DashboardSidebar from "./sidebar";
import MobileBottomNav from "./mobileBottomNav";

/**
 * The dashboard while the gates wait on the account (its standing, whether
 * sign-up is finished): the real sidebar and bottom nav, the top bars with a
 * skeleton for the person, and skeleton blocks for the page. Needs only
 * the logout context, so it can show above the other providers.
 */
export default function DashboardFrameSkeleton() {
    return (
        <div aria-busy>
            <DashboardFrame
                sidebar={<DashboardSidebar />}
                desktopTopbar={
                    <header className={cn(DESKTOP_TOPBAR_CLASS, "justify-between px-8")}>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mist-400 pointer-events-none" />
                            <div className="h-10.5 w-full rounded-lg border border-border bg-white" />
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                            <span className="flex size-10 items-center justify-center rounded-full border border-border">
                                <Bell className="size-4.5 text-mist-600" strokeWidth={1.75} />
                            </span>
                            <div className="flex h-10 items-center gap-2.5 rounded-lg border border-border pr-2.5 pl-1.5">
                                <Skeleton className="size-7 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </header>
                }
                mobileTopbar={
                    <header className={MOBILE_TOPBAR_CLASS}>
                        <LogoLink href={MANUFACTURER_DASHBOARD_URL} className="w-25" />
                        <Skeleton className="size-8 rounded-full" />
                    </header>
                }
                bottomNav={<MobileBottomNav />}
            >
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-8 w-40" />
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:p-5">
                                <Skeleton className="size-10 rounded-full lg:size-11" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-7 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </DashboardFrame>
        </div>
    );
}
