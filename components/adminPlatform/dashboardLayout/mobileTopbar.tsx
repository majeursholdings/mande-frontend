"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import LogoLink from "@/components/ui/logoLink";
import UserAvatar from "@/components/ui/userAvatar";
import { BellIcon, MOBILE_TOPBAR_CLASS } from "@/components/ui/topbarControls";
import { useAdminProfile } from "./adminProfileContext";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import UserMenu from "./userMenu";
import { useStaffPlatform } from "./staffPlatformContext";

/** The phone top bar — logo, notifications (full screen) and the profile menu. */
export default function MobileTopbar() {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { hasUnread } = useNotifications();
    const { profile, fullName } = useAdminProfile();
    const { dashboardUrl } = useStaffPlatform();
    const closeNotifications = () => setIsNotificationsOpen(false);

    return (
        <>
            <header className={MOBILE_TOPBAR_CLASS}>
                <LogoLink href={dashboardUrl} className="w-25" />
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(true)}
                        aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
                        className="relative cursor-pointer"
                    >
                        <BellIcon hasUnread={hasUnread} size="sm" />
                    </button>
                    <UserMenu aria-label="Profile menu" className="rounded-full cursor-pointer">
                        <UserAvatar name={fullName} src={profile.avatarUrl} className="size-8 text-xs" />
                    </UserMenu>
                </div>
            </header>

            {isNotificationsOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                        <button
                            type="button"
                            onClick={closeNotifications}
                            className="flex items-center gap-2 text-sm font-medium font-text text-mist-700 cursor-pointer"
                        >
                            <ArrowLeft className="size-4.5" />
                            Back to Dashboard
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <NotificationsPanel onLinkClick={closeNotifications} />
                    </div>
                </div>
            )}
        </>
    );
}
