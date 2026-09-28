"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSuperAdminActions } from "@/components/superAdminPlatform/actions/pendingActions";
import NavLinks from "./navLinks";
import { isStaffNavItemActive, useStaffPlatform } from "./staffPlatformContext";

const TAB_CLASS =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium font-text transition-colors duration-200";

// ─────────────────────────────────────────────────────────────────────────────
// MobileBottomNav — the phone nav: the four main sections, then Menu, which
// slides the full nav (Profile and Logout too) in from the left.
// Menu shows as active on a page that's only in the drawer.
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileBottomNav() {
    const pathname = usePathname();
    const platform = useStaffPlatform();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const bottomBarItems = platform.navItems.filter((item) => item.inBottomBar);
    // Something waiting under Menu (e.g. the super admin's Actions) puts a dot on it
    const hasWaitingInMenu =
        useSuperAdminActions().length > 0 && platform.navItems.some((item) => !item.inBottomBar && item.countsPendingActions);
    const isOnDrawerOnlyPage = platform.navItems.some(
        (item) => !item.inBottomBar && isStaffNavItemActive(platform, item, pathname),
    );

    return (
        <>
            <nav className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-bottom-nav-height) items-stretch border-t border-border bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
                {bottomBarItems.map((item) => {
                    const isActive = isStaffNavItemActive(platform, item, pathname);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(TAB_CLASS, isActive ? "text-secondary-700" : "text-mist-500")}
                        >
                            <item.icon className="size-6" strokeWidth={1.5} />
                            <span className="whitespace-nowrap">{item.shortLabel ?? item.label}</span>
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    aria-expanded={isMenuOpen}
                    className={cn(
                        TAB_CLASS,
                        "cursor-pointer",
                        isMenuOpen || isOnDrawerOnlyPage ? "text-secondary-700" : "text-mist-500",
                    )}
                >
                    <span className="relative">
                        <Ellipsis className="size-6" strokeWidth={1.5} />
                        {hasWaitingInMenu && (
                            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-secondary-500" aria-hidden />
                        )}
                    </span>
                    {hasWaitingInMenu ? (
                        <>
                            Menu<span className="sr-only">, actions waiting</span>
                        </>
                    ) : (
                        "Menu"
                    )}
                </button>
            </nav>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="gap-0 overflow-y-auto border-r-0 bg-white data-[side=left]:w-62 lg:hidden"
                >
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavLinks onNavigate={() => setIsMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}
