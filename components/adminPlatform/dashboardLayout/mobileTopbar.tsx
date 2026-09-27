"use client";

import { useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { BlackLogo } from "@/components/mainWebsite/navigations/logo";
import UserAvatar from "@/components/ui/userAvatar";
import { ADMIN_PROFILE } from "@/constant/admin";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import UserMenu from "./userMenu";

const FULL_NAME = `${ADMIN_PROFILE.firstName} ${ADMIN_PROFILE.lastName}`;

/** The phone top bar — logo, notifications (full screen) and the profile menu. */
export default function MobileTopbar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { hasUnread } = useNotifications();
    const closeNotifications = () => setIsNotificationsOpen(false);

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
                <div className="w-32">
                    <BlackLogo />
                </div>
                <div className="flex items-center gap-5">
                    <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(true)}
                        aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
                        className="relative cursor-pointer"
                    >
                        <Bell className="size-6 text-mist-800" strokeWidth={1.5} />
                        {hasUnread && (
                            <span className="absolute top-0 right-0.5 size-2 rounded-full bg-error-600" />
                        )}
                    </button>
                    <UserMenu aria-label="Profile menu" className="rounded-full cursor-pointer">
                        <UserAvatar name={FULL_NAME} src={ADMIN_PROFILE.avatarUrl} className="size-8 text-xs" />
                    </UserMenu>
                </div>
            </header>

            {isNotificationsOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
                    <div className="border-b border-border px-4 py-3.5">
                        <button
                            type="button"
                            onClick={closeNotifications}
                            className="flex items-center gap-3 text-lg font-medium font-text text-mist-950 cursor-pointer"
                        >
                            <ArrowLeft className="size-6" />
                            Back to Dashboard
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        <NotificationsPanel onLinkClick={closeNotifications} />
                    </div>
                </div>
            )}
        </>
    );
}
