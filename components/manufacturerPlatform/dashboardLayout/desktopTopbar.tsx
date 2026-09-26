"use client";

import { useCallback, useState } from "react";
import { Bell, Search } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
import { CURRENT_MANUFACTURER_USER, NOTIFICATIONS } from "@/constant/manufacturer";
import NotificationsPanel from "./notificationsPanel";
import SearchPanel from "./searchPanel";
import UserAvatar from "./userAvatar";

export default function DesktopTopbar() {
    const [query, setQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const searchRef = useOutsideClickRef<HTMLDivElement>(closeSearch);
    const hasUnread = NOTIFICATIONS.some((n) => !n.isRead);

    return (
        <header className="sticky top-0 left-0 hidden lg:flex items-center justify-between gap-6 border-b border-border bg-white px-8 py-4 z-30">
            <div ref={searchRef} className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mist-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search"
                    className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm font-text text-mist-900 placeholder:text-mist-400 outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all duration-200"
                />

                {isSearchOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full rounded-lg border border-border bg-white p-4 shadow-lg z-50">
                        <SearchPanel
                            onSelect={(term) => {
                                setQuery(term);
                                closeSearch();
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
                <Popover>
                    <PopoverTrigger className="relative flex items-center justify-center size-10 rounded-full border border-border hover:bg-mist-50 transition-colors duration-200 cursor-pointer">
                        <Bell className="size-4.5 text-mist-600" strokeWidth={1.75} />
                        {hasUnread && (
                            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-secondary-500" />
                        )}
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={10} className="w-96 p-4">
                        <NotificationsPanel />
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2.5 pl-1">
                    <UserAvatar name={CURRENT_MANUFACTURER_USER.name} className="size-9 text-sm" />
                    <span className="text-sm font-medium font-text text-mist-900 whitespace-nowrap">
                        {CURRENT_MANUFACTURER_USER.name}
                    </span>
                </div>
            </div>
        </header>
    );
}
