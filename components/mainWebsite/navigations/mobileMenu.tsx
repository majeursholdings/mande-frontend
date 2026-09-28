"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import LogoLink from "@/components/ui/logoLink";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL, mainmenu } from "@/constant/navigation";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { MenuIcon } from "./menuIcons";

// Full-width rows like the dashboards' side menu — the page you're on tinted,
// with a green bar on its left edge
const ROW_CLASS =
    "relative flex w-full items-center gap-3 px-6 py-3 text-base transition-colors duration-200 cursor-pointer";
const ROW_IDLE_CLASS = "text-mist-700 hover:bg-mist-50 hover:text-mist-950";
const ROW_ACTIVE_CLASS =
    "bg-primary-50 text-primary-800 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary-700";

type MenuItem = (typeof mainmenu)[number];

function MobileMenuItem({ item, pathname, onNavigate }: { item: MenuItem; pathname: string; onNavigate: () => void }) {
    const isChildActive = Boolean(item.subMenu?.some((sub) => sub.href === pathname));
    const [isOpen, setIsOpen] = useState(isChildActive);

    if (item.subMenu && item.subMenu.length > 0) {
        return (
            <li className="flex flex-col">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-expanded={isOpen}
                    className={cn(ROW_CLASS, isChildActive ? "text-primary-800" : ROW_IDLE_CLASS)}
                >
                    <MenuIcon item={item} className="size-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                        className={cn("size-4 text-mist-500 transition-transform duration-200", isOpen && "rotate-180")}
                        aria-hidden
                    />
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex flex-col overflow-hidden"
                        >
                            {item.subMenu.map((subItem) => {
                                const isSubActive = subItem.href === pathname;
                                return (
                                    <li key={subItem.label}>
                                        <Link
                                            href={subItem.href as string}
                                            onClick={onNavigate}
                                            aria-current={isSubActive ? "page" : undefined}
                                            className={cn(
                                                ROW_CLASS,
                                                "flex-col items-start gap-0.5 py-2.5 pl-14",
                                                isSubActive ? ROW_ACTIVE_CLASS : ROW_IDLE_CLASS,
                                            )}
                                        >
                                            <span className="text-sm font-medium">{subItem.label}</span>
                                            {subItem.description && (
                                                <span className="text-xs font-light text-mist-500">{subItem.description}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </li>
        );
    }

    const isActive = item.href === pathname;
    return (
        <li>
            <Link
                href={item.href || "#"}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(ROW_CLASS, isActive ? ROW_ACTIVE_CLASS : ROW_IDLE_CLASS)}
            >
                <MenuIcon item={item} className="size-5 shrink-0" />
                {item.label}
            </Link>
        </li>
    );
}

/**
 * The website menu below lg — a white drawer in the platforms' style: the
 * logo, every page as a row (Help Center opening to its pages), and Log in /
 * Sign up at the bottom. It closes once a page is picked.
 */
export default function MobileMenu() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger aria-label="Open menu" className="flex cursor-pointer items-center">
                <Menu className="size-6 text-mist-100" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="flex h-full w-80 max-w-[85vw] flex-col gap-0 bg-white p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="border-b border-border px-6 py-5">
                    <LogoLink href="/" label="MANDE, go to the homepage" onClick={close} className="w-28" />
                </div>

                <nav aria-label="Main" className="flex-1 overflow-y-auto py-4">
                    <ul className="flex flex-col gap-0.5">
                        {mainmenu.map((item) => (
                            <MobileMenuItem key={item.label} item={item} pathname={pathname} onNavigate={close} />
                        ))}
                    </ul>
                </nav>

                <div className="flex flex-col gap-3 border-t border-border p-6">
                    <Link href={ARTISAN_SIGNUP_URL} onClick={close} className={cn(WEBSITE_PRIMARY_BUTTON, "w-full py-2.5")}>
                        Sign up
                    </Link>
                    <Link href={ARTISAN_LOGIN_URL} onClick={close} className={cn(WEBSITE_OUTLINE_BUTTON, "w-full py-2.5")}>
                        Log in
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
