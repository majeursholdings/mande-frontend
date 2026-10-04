"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// RecentSearchesProvider — the search panel's recent searches, shared by the
// desktop and mobile top bars. A term is added when a search result is opened.
// Kept in memory for the visit; persist them per user once the API can.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RECENT_SEARCHES = 5;

type RecentSearchesContextValue = {
    recentSearches: string[];
    addRecentSearch: (term: string) => void;
    clearRecentSearches: () => void;
};

const RecentSearchesContext = createContext<RecentSearchesContextValue | null>(null);

export function RecentSearchesProvider({ children }: { children: ReactNode }) {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Newest first; searching a term again moves it to the front
    const addRecentSearch = useCallback((term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        setRecentSearches((current) =>
            [
                trimmed,
                ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
            ].slice(0, MAX_RECENT_SEARCHES),
        );
    }, []);

    const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

    const value: RecentSearchesContextValue = useMemo(
        () => ({ recentSearches, addRecentSearch, clearRecentSearches }),
        [recentSearches, addRecentSearch, clearRecentSearches],
    );

    return <RecentSearchesContext.Provider value={value}>{children}</RecentSearchesContext.Provider>;
}

export function useRecentSearches() {
    const context = useContext(RecentSearchesContext);
    if (!context) {
        throw new Error("useRecentSearches must be used within a RecentSearchesProvider");
    }
    return context;
}
