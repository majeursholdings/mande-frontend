"use client";

import { useState } from "react";
import Logo from "./logo";
import Link from "next/link";
import MobileMenu from "./mobileMenu";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, mainmenu } from "@/constant/navigation";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { MenuIcon } from "./menuIcons";
import { WEBSITE_ON_DARK_BUTTON } from "../common/buttonStyles";

// A menu item fills the bar's height, so the page you're on can underline it
// along the bar's bottom edge
const NAV_LINK_CLASS =
    "relative flex h-full items-center text-[15px] font-normal transition-colors duration-300 hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors";
const NAV_LINK_IDLE_CLASS = "text-mist-100/80 after:bg-transparent";
const NAV_LINK_ACTIVE_CLASS = "text-white after:bg-primary-400";

// ─────────────────────────────────────────────────────────────────────────────
// The website header — the logo, the menu (from lg; the drawer below it) and
// Log in / Sign up. The page you're on is underlined in green along the
// bar's bottom edge. Help Center opens a dropdown in the platforms' popover
// style: a white card with each page's icon, name and a line about it.
// ─────────────────────────────────────────────────────────────────────────────

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 right-0 left-0 z-50 w-full border-b border-white/10 bg-primary-950 px-2.5 sm:px-6 lg:px-8">
            <div className="container mx-auto flex h-16 items-center justify-between gap-5">
                <Link
                    href="/"
                    aria-label="MANDE, go to the homepage"
                    className="w-full max-w-28 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
                >
                    <Logo />
                </Link>

                <nav aria-label="Main" className="hidden h-full items-stretch justify-center gap-7 lg:flex">
                    {mainmenu.map((item) => {
                        const hasSubMenu = Boolean(item.subMenu && item.subMenu.length > 0);
                        const isChildActive = Boolean(item.subMenu?.some((sub) => sub.href === pathname));
                        const isActive = item.href === pathname || isChildActive;

                        if (!hasSubMenu) {
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href as string}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(NAV_LINK_CLASS, isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_IDLE_CLASS)}
                                >
                                    {item.label}
                                </Link>
                            );
                        }

                        return (
                            <HeaderDropdownItem key={item.label} item={item} pathname={pathname} isActive={isActive} />
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-5 lg:flex">
                    <Link
                        href={ARTISAN_LOGIN_URL}
                        className="text-[15px] text-mist-100/80 transition-colors duration-300 hover:text-white"
                    >
                        Log in
                    </Link>
                    <Link href={ARTISAN_SIGNUP_URL} className={cn(WEBSITE_ON_DARK_BUTTON, "py-1.5 text-[15px]")}>
                        Sign up
                    </Link>
                </div>

                <div className="flex lg:hidden">
                    <MobileMenu />
                </div>
            </div>
        </header>
    );
}

function HeaderDropdownItem({
    item,
    pathname,
    isActive,
}: {
    item: (typeof mainmenu)[number];
    pathname: string;
    isActive: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative flex h-full items-stretch"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            // Closes when focus leaves the item and its dropdown, e.g. tabbing past
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") setIsOpen(false);
            }}
        >
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    NAV_LINK_CLASS,
                    "cursor-pointer gap-1.5",
                    isActive ? NAV_LINK_ACTIVE_CLASS : isOpen ? "text-white after:bg-transparent" : NAV_LINK_IDLE_CLASS,
                )}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span>{item.label}</span>
                <ChevronDown className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")} aria-hidden />
            </button>

            <AnimatePresence>
                {isOpen && item.subMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-1/2 z-50 w-72 -translate-x-1/2 pt-1"
                    >
                        <ul className="flex flex-col gap-0.5 rounded-xl border border-border bg-white p-1.5 shadow-lg">
                            {item.subMenu.map((subItem) => {
                                const isSubActive = subItem.href === pathname;
                                return (
                                    <li key={subItem.label}>
                                        <Link
                                            href={subItem.href as string}
                                            onClick={() => setIsOpen(false)}
                                            aria-current={isSubActive ? "page" : undefined}
                                            className={cn(
                                                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200",
                                                isSubActive ? "bg-primary-50" : "hover:bg-mist-50 focus-visible:bg-mist-50",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                                    isSubActive ? "bg-primary-100 text-primary-800" : "bg-mist-100 text-mist-700",
                                                )}
                                            >
                                                <MenuIcon item={subItem} className="size-4.5" />
                                            </span>
                                            <span className="flex min-w-0 flex-col gap-0.5">
                                                <span
                                                    className={cn(
                                                        "text-sm font-medium",
                                                        isSubActive ? "text-primary-800" : "text-mist-950",
                                                    )}
                                                >
                                                    {subItem.label}
                                                </span>
                                                {subItem.description && (
                                                    <span className="text-xs font-light text-mist-500">{subItem.description}</span>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
