"use client";

import { useCallback, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useMediaQuery — whether a CSS media query matches, kept in sync as the
// viewport changes. For behaviour CSS can't switch on its own (e.g. a tab
// list's arrow-key orientation). Reads as `false` during the server render.
// ─────────────────────────────────────────────────────────────────────────────

export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const media = window.matchMedia(query);
            media.addEventListener("change", onChange);
            return () => media.removeEventListener("change", onChange);
        },
        [query],
    );

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => false,
    );
}
