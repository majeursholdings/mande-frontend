"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { queryKeys } from "@/lib/queryKeys";
import { getSocket } from "@/lib/socket";

// ─────────────────────────────────────────────────────────────────────────────
// Live shop pages for sellers and staff (SHOP_IMPLEMENTATION.md 6): the API
// nudges a manufacturer's sockets when their orders, returns or payouts
// change, and every admin's for MANDE stock ("shop:seller-updated"). The
// shop pages then fetch again, so a new order or a customer's cancellation
// shows without a reload. It rides the app's one socket (lib/socket.ts); if
// that isn't open yet (no token at first), it attaches once a token arrives.
// ─────────────────────────────────────────────────────────────────────────────

type Nudge = { area: "orders" | "returns" | "payouts"; sellerKind: "manufacturer" | "mande" };

function subscribe(queryClient: QueryClient, onChange: () => void): () => void {
    let attached: Socket | null = null;
    const onNudge = (nudge: Nudge) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });
        // Released or taken-back shares change the wallet too
        if (nudge.area === "payouts") void queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    };
    const onConnection = () => onChange();
    const attach = () => {
        const socket = getSocket();
        if (!socket || socket === attached) return;
        attached?.off("shop:seller-updated", onNudge);
        socket.on("shop:seller-updated", onNudge);
        socket.on("connect", onConnection);
        socket.on("disconnect", onConnection);
        attached = socket;
        onChange();
    };
    attach();
    window.addEventListener("mande:auth_token_changed", attach);
    return () => {
        window.removeEventListener("mande:auth_token_changed", attach);
        attached?.off("shop:seller-updated", onNudge);
        attached?.off("connect", onConnection);
        attached?.off("disconnect", onConnection);
    };
}

/** Keeps the shop pages up to date while mounted. Returns whether the socket is connected. */
export function useShopLiveUpdates(): boolean {
    const queryClient = useQueryClient();
    const subscribeWith = useCallback((onChange: () => void) => subscribe(queryClient, onChange), [queryClient]);
    return useSyncExternalStore(
        subscribeWith,
        () => getSocket()?.connected ?? false,
        () => false,
    );
}
