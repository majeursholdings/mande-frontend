"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ShopNavLink = {
    href: string;
    label: string;
    /** Active only on this exact page (the overview), not the pages under it. */
    exact?: boolean;
};

// The same look as ResponsiveTabs' underline row: the active page bold, with a bar under it
const LINK_CLASS =
    "relative block shrink-0 whitespace-nowrap px-4 py-4 text-[15px] font-medium font-text text-mist-500 outline-none transition-colors duration-200 hover:bg-mist-100/70 focus-visible:bg-mist-100";
const ACTIVE_CLASS =
    "font-bold text-mist-950 after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-14 after:-translate-x-1/2 after:rounded-full after:bg-secondary-700";

/**
 * The shop's sub-pages as a row of links (overview, products, delivery zones,
 * payouts, orders...): one page each, so each has its own address and back
 * button. Scrolls sideways when it runs out of room on a phone.
 */
export default function ShopSubNav({ links, label }: { links: ShopNavLink[]; label: string }) {
    const pathname = usePathname();
    return (
        <nav aria-label={label} className="border-b border-border">
            <ul className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {links.map((link) => {
                    const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                        <li key={link.href} className="shrink-0">
                            <Link href={link.href} aria-current={active ? "page" : undefined} className={cn(LINK_CLASS, active && ACTIVE_CLASS)}>
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
