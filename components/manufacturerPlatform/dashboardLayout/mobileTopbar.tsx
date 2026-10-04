"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { MANUFACTURER_DASHBOARD_URL, getManufacturerFullName, getSubpageBackLink } from "@/constant/manufacturer";
import LogoLink from "@/components/ui/logoLink";
import { useManufacturerProfile } from "./manufacturerProfileContext";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import SearchPanel, { SEARCH_PLACEHOLDERS, type SearchScope } from "./searchPanel";
import UserAvatar from "@/components/ui/userAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BellIcon, MOBILE_TOPBAR_CLASS } from "@/components/ui/topbarControls";
import UserMenu from "./userMenu";

type MobileOverlay = "search" | "notifications" | null;

export default function MobileTopbar() {
    const [overlay, setOverlay] = useState<MobileOverlay>(null);
    const [query, setQuery] = useState("");
    // Kept between searches, so the next one looks in the same place
    const [searchScope, setSearchScope] = useState<SearchScope>("open");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { hasUnread } = useNotifications();
    const { profile, isLoading: isProfileLoading } = useManufacturerProfile();
    const backLink = getSubpageBackLink(usePathname());

    if (backLink) {
        return (
            <header className="lg:hidden sticky top-0 z-30 flex items-center border-b border-border bg-white px-4 py-3.5">
                <Link
                    href={backLink.href}
                    className="flex items-center gap-3 text-lg font-medium font-text text-mist-950"
                >
                    <ArrowLeft className="size-6" />
                    {backLink.label}
                </Link>
            </header>
        );
    }

    return (
        <>
            <header className={MOBILE_TOPBAR_CLASS}>
                <LogoLink href={MANUFACTURER_DASHBOARD_URL} className="w-25" />

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setOverlay("search")}
                        aria-label="Search"
                        className="cursor-pointer"
                    >
                        <Search className="size-5 text-mist-700" strokeWidth={1.75} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setOverlay("notifications")}
                        aria-label={hasUnread ? "Notifications, unread" : "Notifications"}
                        className="relative cursor-pointer"
                    >
                        <BellIcon hasUnread={hasUnread} size="sm" />
                    </button>
                    <UserMenu aria-label="Profile menu" className="rounded-full cursor-pointer">
                        {isProfileLoading ? (
                            <Skeleton className="size-8 rounded-full" />
                        ) : (
                            <UserAvatar
                                name={getManufacturerFullName(profile)}
                                src={profile.avatarUrl}
                                className="size-8 text-xs"
                            />
                        )}
                    </UserMenu>
                </div>
            </header>

            {overlay === "notifications" && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                        <button
                            type="button"
                            onClick={() => setOverlay(null)}
                            className="flex items-center gap-2 text-sm font-medium font-text text-mist-700 cursor-pointer"
                        >
                            <ArrowLeft className="size-4.5" />
                            Back to Dashboard
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <NotificationsPanel onLinkClick={() => setOverlay(null)} />
                    </div>
                </div>
            )}

            {overlay === "search" && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-mist-400 pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={SEARCH_PLACEHOLDERS[searchScope]}
                                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm font-text text-mist-900 placeholder:text-mist-400 outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all duration-200"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setOverlay(null)}
                            className="text-sm font-medium font-text text-mist-700 cursor-pointer shrink-0"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <SearchPanel
                            query={query}
                            scope={searchScope}
                            onScopeChange={(scope) => {
                                setSearchScope(scope);
                                searchInputRef.current?.focus();
                            }}
                            onRecentSearchSelect={setQuery}
                            onResultSelect={() => {
                                setQuery("");
                                setOverlay(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
