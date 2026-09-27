"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import UserAvatar from "@/components/ui/userAvatar";
import { ADMIN_PROFILE } from "@/constant/admin";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import UserMenu from "./userMenu";

const FULL_NAME = `${ADMIN_PROFILE.firstName} ${ADMIN_PROFILE.lastName}`;

/** The desktop top bar — notifications and the profile menu, right-aligned. */
export default function DesktopTopbar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { hasUnread } = useNotifications();

    return (
        <header className="sticky top-0 z-30 hidden items-center justify-end gap-4 bg-white px-10 pt-10 pb-4 lg:flex">
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <PopoverTrigger
                    aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
                    className="relative flex size-10 items-center justify-center rounded-lg border border-border hover:bg-mist-50 transition-colors duration-200 cursor-pointer"
                >
                    <Bell className="size-4.5 text-mist-700" strokeWidth={1.75} />
                    {hasUnread && (
                        <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-error-600" />
                    )}
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={10} className="w-96 p-6">
                    <NotificationsPanel onLinkClick={() => setIsNotificationsOpen(false)} />
                </PopoverContent>
            </Popover>

            <UserMenu className="flex items-center gap-2.5 rounded-lg border border-border py-1.5 pr-3 pl-1.5 hover:bg-mist-50 data-popup-open:bg-mist-50 transition-colors duration-200 cursor-pointer">
                <UserAvatar name={FULL_NAME} src={ADMIN_PROFILE.avatarUrl} className="size-7 text-xs" />
                <span className="text-sm font-medium font-text text-mist-900 whitespace-nowrap">
                    {FULL_NAME}
                </span>
            </UserMenu>
        </header>
    );
}
