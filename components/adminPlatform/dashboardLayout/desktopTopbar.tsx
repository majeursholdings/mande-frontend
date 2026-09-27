"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    BellIcon,
    DESKTOP_BELL_CLASS,
    DESKTOP_TOPBAR_CLASS,
    DESKTOP_USER_CARD_CLASS,
    UserCardContent,
} from "@/components/ui/topbarControls";
import { useAdminProfile } from "./adminProfileContext";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import UserMenu from "./userMenu";

/** The desktop top bar — notifications and the profile menu, right-aligned. */
export default function DesktopTopbar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { hasUnread } = useNotifications();
    const { profile, fullName } = useAdminProfile();

    return (
        <header className={cn(DESKTOP_TOPBAR_CLASS, "justify-end gap-4 px-8")}>
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <PopoverTrigger
                    aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
                    className={DESKTOP_BELL_CLASS}
                >
                    <BellIcon hasUnread={hasUnread} />
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={10} className="w-96 p-4">
                    <NotificationsPanel onLinkClick={() => setIsNotificationsOpen(false)} />
                </PopoverContent>
            </Popover>

            <UserMenu className={DESKTOP_USER_CARD_CLASS}>
                <UserCardContent name={fullName} avatarUrl={profile.avatarUrl} />
            </UserMenu>
        </header>
    );
}
