"use client";

import { useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useOutsideClickRef
//
// Returns a callback ref: attach it to the element that should stay open as
// long as clicks land inside it (a dropdown's trigger + panel wrapper). A
// mousedown outside it calls `onOutside` (typically closing the dropdown).
//
// Implemented as a ref callback with a returned cleanup — the React 19
// replacement for "attach a listener on mount, detach on unmount" — instead
// of useRef + useEffect. Pass a referentially stable `onOutside` (e.g. wrap
// it in `useCallback(() => setOpen(false), [])`, since useState setters are
// themselves stable) so the listener attaches exactly once per mount instead
// of detaching/reattaching on every render.
// ─────────────────────────────────────────────────────────────────────────────

export function useOutsideClickRef<T extends HTMLElement>(
    onOutside: () => void,
) {
    return useCallback(
        (node: T | null) => {
            if (!node) return;
            const handler = (e: MouseEvent) => {
                if (!node.contains(e.target as Node)) onOutside();
            };
            document.addEventListener("mousedown", handler);
            return () => document.removeEventListener("mousedown", handler);
        },
        [onOutside],
    );
}
