import { Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";

// ─────────────────────────────────────────────────────────────────────────────
// The dashboard top bar's controls, the same on both platforms: the desktop
// bar itself, the bell (round on desktop, a bare icon on phones) and the
// profile card that opens the user menu (a bordered card with a chevron on
// desktop, the avatar alone on phones). Each platform wires its own
// notifications and menu to them.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The desktop top bar — add the justification, and px-8 to line up with the
 * page (see DashboardFrame). `shrink-0`, as it's a flex item in the scrolling column and
 * would otherwise shrink to its contents' height.
 */
export const DESKTOP_TOPBAR_CLASS =
    "sticky top-0 z-30 hidden h-19 shrink-0 items-center gap-6 border-b border-border bg-white lg:flex";

/** The phone top bar. */
export const MOBILE_TOPBAR_CLASS =
    "sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 lg:hidden";

/** On the bell's trigger, desktop. */
export const DESKTOP_BELL_CLASS =
    "relative flex size-10 items-center justify-center rounded-full border border-border hover:bg-mist-50 data-popup-open:bg-mist-50 transition-colors duration-200 cursor-pointer";

/** On the profile card's trigger (the user menu), desktop. */
export const DESKTOP_USER_CARD_CLASS =
    "group flex h-10 items-center gap-2.5 rounded-lg border border-border pr-2.5 pl-1.5 hover:bg-mist-50 data-popup-open:bg-mist-50 transition-colors duration-200 cursor-pointer";

/** The bell, with a dot while there's something unread — `size` "sm" on phones. */
export function BellIcon({ hasUnread, size = "md" }: { hasUnread: boolean; size?: "sm" | "md" }) {
    return (
        <>
            <Bell
                className={cn(size === "md" ? "size-4.5 text-mist-600" : "size-5 text-mist-700")}
                strokeWidth={1.75}
            />
            {hasUnread && (
                <span
                    className={cn(
                        "absolute rounded-full bg-secondary-500",
                        size === "md" ? "top-2.5 right-2.5 size-1.5" : "-top-0.5 -right-0.5 size-2",
                    )}
                />
            )}
        </>
    );
}

/** Inside DESKTOP_USER_CARD_CLASS: avatar, name, and a chevron that turns while the menu's open. */
export function UserCardContent({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
    return (
        <>
            <UserAvatar name={name} src={avatarUrl} className="size-7 text-xs" />
            {name && (
                <span className="text-sm font-medium font-text whitespace-nowrap text-mist-900">{name}</span>
            )}
            <ChevronDown className="size-4 text-mist-500 transition-transform duration-200 group-data-popup-open:rotate-180" />
        </>
    );
}
