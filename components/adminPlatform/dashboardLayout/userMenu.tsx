"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ADMIN_PROFILE_URL } from "@/constant/admin";
import { useLogout } from "./logoutContext";

const MENU_ITEM_CLASS =
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium font-text transition-colors duration-200 cursor-pointer";

/**
 * The top bars' profile popup: View profile and Logout. `children` is the
 * trigger's content (avatar + name on desktop, just the avatar on mobile).
 */
export default function UserMenu({
    children,
    className,
    "aria-label": ariaLabel,
}: {
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const { requestLogout } = useLogout();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger aria-label={ariaLabel} className={className}>
                {children}
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="w-52 gap-0.5 p-1.5">
                <Link
                    href={ADMIN_PROFILE_URL}
                    onClick={() => setIsOpen(false)}
                    className={cn(MENU_ITEM_CLASS, "text-mist-700 hover:bg-mist-50 hover:text-mist-950")}
                >
                    <UserRound className="size-4 shrink-0" strokeWidth={1.75} />
                    View profile
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        requestLogout();
                    }}
                    className={cn(MENU_ITEM_CLASS, "text-error-600 hover:bg-error-50")}
                >
                    <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                    Logout
                </button>
            </PopoverContent>
        </Popover>
    );
}
