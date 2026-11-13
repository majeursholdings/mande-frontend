"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// useLinkedItem: a page opening the one item a link points at (a
// notification's "View return", "Review report"... with ?return=, ?report=
// and so on). The item is used straight from the page's list when it's
// there; otherwise it's fetched on its own, once the list has loaded. Once
// the person closes it, it stays closed (the link's still in the URL).
// The page shows `picked ?? linked`, and calls `closeLink` when its dialog
// closes.
// ─────────────────────────────────────────────────────────────────────────────

export function useLinkedItem<T>({
    id,
    queryKey,
    findOnPage,
    fetchOne,
    ready,
    notFoundMessage = "We couldn't open that. Find it in the list below.",
}: {
    /** The item the URL names, or null. */
    id: string | null;
    /** The page's query key, so the item is refreshed with it. */
    queryKey: readonly unknown[];
    /** The item when it's on the page already. */
    findOnPage: (id: string) => T | null | undefined;
    fetchOne: (id: string) => Promise<T>;
    /** The page's list has loaded (so it's known whether the item is on it). */
    ready: boolean;
    notFoundMessage?: string;
}) {
    const [closed, setClosed] = useState(false);
    const wanted = !closed && id ? id : null;
    const onPage = wanted ? (findOnPage(wanted) ?? null) : null;
    const query = useQuery({
        queryKey: [...queryKey, "linked", wanted],
        queryFn: async () => {
            try {
                return await fetchOne(wanted!);
            } catch (error) {
                toast.error(getErrorMessage(error, notFoundMessage));
                throw error;
            }
        },
        enabled: !!wanted && ready && !onPage,
        retry: false,
        staleTime: 30_000,
    });
    return { linked: onPage ?? (wanted ? (query.data ?? null) : null), closeLink: () => setClosed(true) };
}
