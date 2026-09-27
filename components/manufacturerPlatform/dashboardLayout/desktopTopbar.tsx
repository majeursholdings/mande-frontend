"use client";

import { useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
import SearchPanel, { SEARCH_PLACEHOLDERS, type SearchScope } from "./searchPanel";
import {
    BellIcon,
    DESKTOP_BELL_CLASS,
    DESKTOP_TOPBAR_CLASS,
    DESKTOP_USER_CARD_CLASS,
    UserCardContent,
} from "@/components/ui/topbarControls";
import UserMenu from "./userMenu";

export default function DesktopTopbar() {
    const [query, setQuery] = useState("");
    // Kept between searches, so the next one looks in the same place
    const [searchScope, setSearchScope] = useState<SearchScope>("open");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const searchRef = useOutsideClickRef<HTMLDivElement>(closeSearch);
    const inputRef = useRef<HTMLInputElement>(null);
    const { hasUnread } = useNotifications();
    const { profile } = useManufacturerProfile();
    const fullName = getManufacturerFullName(profile);

    return (
        <header className={cn(DESKTOP_TOPBAR_CLASS, "justify-between px-8")}>
            <div ref={searchRef} className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-mist-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder={SEARCH_PLACEHOLDERS[searchScope]}
                    className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm font-text text-mist-900 placeholder:text-mist-400 outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 transition-all duration-200"
                />

                {isSearchOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full max-h-96 overflow-y-auto rounded-lg border border-border bg-white p-4 shadow-lg z-50">
                        <SearchPanel
                            query={query}
                            scope={searchScope}
                            onScopeChange={(scope) => {
                                setSearchScope(scope);
                                inputRef.current?.focus();
                            }}
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
            </div>
        </header>
    );
}
