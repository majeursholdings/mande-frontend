"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { LogOut, Settings, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MANUFACTURER_PROFILE_URL, MANUFACTURER_SETTINGS_URL } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// UserMenu — the top bars' profile popup: View profile, Settings and
// Logout. `children` is the trigger's content (avatar + name on desktop, just
// the avatar on mobile). Controlled so clicking a link closes it — the top
// bars live in the layout, so they stay mounted across navigations.
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "View profile", href: MANUFACTURER_PROFILE_URL, icon: UserRound },
    { label: "Settings", href: MANUFACTURER_SETTINGS_URL, icon: Settings },
];

const MENU_LINK_CLASS =
    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium font-text transition-colors duration-200";

export default function UserMenu({
    children,
    className,
    "aria-label": ariaLabel,
}: {
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
}) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger aria-label={ariaLabel} className={className}>
                {children}
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-52 gap-0.5 p-1.5">
                {PROFILE_LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={close}
                        className={cn(MENU_LINK_CLASS, "text-mist-700 hover:bg-mist-50 hover:text-mist-950")}
                    >
                        <link.icon className="size-4 shrink-0" strokeWidth={1.75} />
                        {link.label}
                    </Link>
                ))}
                <div className="my-1 h-px bg-border" />
                <Link
                    href={ARTISAN_LOGIN_URL}
                    onClick={close}
                    className={cn(MENU_LINK_CLASS, "text-secondary-600 hover:bg-secondary-50")}
                >
                    <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                    Logout
                </Link>
            </PopoverContent>
        </Popover>
    );
}
