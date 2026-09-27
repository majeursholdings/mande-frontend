"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlackLogo } from "@/components/mainWebsite/navigations/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from "@/constant/admin";
import NavLinks from "./navLinks";

const TAB_CLASS =
    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium font-text transition-colors duration-200";

// ─────────────────────────────────────────────────────────────────────────────
// MobileBottomNav — the phone nav: the four main sections, then Menu, which
// slides the full nav (Transactions, Profile, Logout too) in from the left.
// Menu shows as active on a page that's only in the drawer.
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const bottomBarItems = ADMIN_NAV_ITEMS.filter((item) => item.inBottomBar);
    const isOnDrawerOnlyPage = ADMIN_NAV_ITEMS.some(
        (item) => !item.inBottomBar && isAdminNavItemActive(item, pathname),
    );

    return (
        <>
            <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
                {bottomBarItems.map((item) => {
                    const isActive = isAdminNavItemActive(item, pathname);
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
                    <Ellipsis className="size-6" strokeWidth={1.5} />
                    Menu
                </button>
            </nav>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="gap-12 border-r-0 bg-white pt-10 pb-16 data-[side=left]:w-62 lg:hidden"
                >
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <div className="px-10">
                        <div className="max-w-30">
                            <BlackLogo />
                        </div>
                    </div>
                    <NavLinks onNavigate={() => setIsMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}
