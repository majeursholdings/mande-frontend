"use client";

import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

// ─────────────────────────────────────────────────────────────────────────────
// useIsClient — false on the server and while hydrating, true straight after.
// For content worked out from the current moment (e.g. a live activity
// feed), which a render done earlier on the server would never match: show a
// placeholder until it's true.
// ─────────────────────────────────────────────────────────────────────────────

export function useIsClient(): boolean {
    return useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false,
    );
}
