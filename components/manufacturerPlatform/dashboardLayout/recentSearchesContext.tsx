"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { RECENT_SEARCHES } from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// RecentSearchesProvider — the search panel's recent searches, shared by the
// desktop and mobile top bars. A term is added when a search result is opened.
// Seeded from sample data and kept in memory for now; persist them per user
// once the backend is connected.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RECENT_SEARCHES = 5;

type RecentSearchesContextValue = {
    recentSearches: string[];
    addRecentSearch: (term: string) => void;
    clearRecentSearches: () => void;
};

const RecentSearchesContext = createContext<RecentSearchesContextValue | null>(null);

export function RecentSearchesProvider({ children }: { children: ReactNode }) {
    const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

    // Newest first; searching a term again moves it to the front
    const addRecentSearch = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        setRecentSearches((current) =>
            [
                trimmed,
                ...current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()),
            ].slice(0, MAX_RECENT_SEARCHES),
        );
    };

    const clearRecentSearches = () => setRecentSearches([]);

    return (
        <RecentSearchesContext.Provider
            value={{ recentSearches, addRecentSearch, clearRecentSearches }}
        >
            {children}
        </RecentSearchesContext.Provider>
    );
}

export function useRecentSearches() {
    const context = useContext(RecentSearchesContext);
    if (!context) {
        throw new Error("useRecentSearches must be used within a RecentSearchesProvider");
    }
    return context;
}
