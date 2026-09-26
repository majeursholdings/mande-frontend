"use client";

import { useCallback, useRef, useState } from "react";
import { Bell, ChevronDown, Search } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
import { getManufacturerFullName } from "@/constant/manufacturer";
import { useManufacturerProfile } from "./manufacturerProfileContext";
import { useNotifications } from "./notificationsContext";
import NotificationsPanel from "./notificationsPanel";
import SearchPanel from "./searchPanel";
import UserAvatar from "./userAvatar";
import UserMenu from "./userMenu";

export default function DesktopTopbar() {
    const [query, setQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const searchRef = useOutsideClickRef<HTMLDivElement>(closeSearch);
    const inputRef = useRef<HTMLInputElement>(null);
    const { hasUnread } = useNotifications();
    const { profile } = useManufacturerProfile();
    const fullName = getManufacturerFullName(profile);

    return (
        <header className="sticky top-0 left-0 hidden lg:flex items-center justify-between gap-6 border-b border-border bg-white px-8 py-4 z-30">
            <div ref={searchRef} className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mist-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search Job..."
                    className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm font-text text-mist-900 placeholder:text-mist-400 outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all duration-200"
                />

                {isSearchOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto rounded-lg border border-border bg-white p-4 shadow-lg z-50">
                        <SearchPanel
                            query={query}
                            onRecentSearchSelect={(term) => {
                                setQuery(term);
                                inputRef.current?.focus();
                            }}
                            onResultSelect={() => {
                                setQuery("");
                                closeSearch();
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
                <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                    <PopoverTrigger className="relative flex items-center justify-center size-10 rounded-full border border-border hover:bg-mist-50 transition-colors duration-200 cursor-pointer">
                        <Bell className="size-4.5 text-mist-600" strokeWidth={1.75} />
                        {hasUnread && (
                            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-secondary-500" />
                        )}
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={10} className="w-96 p-4">
                        <NotificationsPanel onLinkClick={() => setIsNotificationsOpen(false)} />
                    </PopoverContent>
                </Popover>

                <UserMenu className="group flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-2.5 hover:bg-mist-50 data-popup-open:bg-mist-50 transition-colors duration-200 cursor-pointer">
                    <UserAvatar name={fullName} src={profile.avatarUrl} className="size-9 text-sm" />
                    {fullName && (
                        <span className="text-sm font-medium font-text text-mist-900 whitespace-nowrap">
                            {fullName}
                        </span>
                    )}
                    <ChevronDown className="size-4 text-mist-500 transition-transform duration-200 group-data-popup-open:rotate-180" />
                </UserMenu>
            </div>
        </header>
    );
}
