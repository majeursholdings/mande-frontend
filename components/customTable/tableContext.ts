"use client";

import { createContext, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// TableIdContext
// ─────────────────────────────────────────────────────────────────────────────

export const TableIdContext = createContext<string>("");

// ─────────────────────────────────────────────────────────────────────────────
// useTableParam  — namespaced URL-param hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTableParam(tableId: string) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const ns = useCallback((key: string) => `${tableId}_${key}`, [tableId]);

    const setParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            const nsKey = ns(key);
            if (value) params.set(nsKey, value);
            else params.delete(nsKey);
            if (key !== "page") params.delete(ns("page"));
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        },
        [router, pathname, searchParams, ns],
    );

    const getParam = useCallback(
        (key: string) => searchParams.get(ns(key)),
        [searchParams, ns],
    );

    return { getParam, setParam };
}
