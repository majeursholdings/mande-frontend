"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { redirect, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDashboardUrlForRole } from "@/hooks/useAuthRedirect";

let sessionExpiredAt = 0;
const sessionListeners = new Set<() => void>();

function notifySessionListeners() {
    sessionListeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
    window.addEventListener("mande:session-expired", () => {
        sessionExpiredAt = Date.now();
        notifySessionListeners();
    });
    window.addEventListener("mande:auth_token_changed", (event: Event) => {
        const customEvent = event as CustomEvent<{ token: string | null }>;
        if (customEvent.detail?.token) {
            sessionExpiredAt = 0;
            notifySessionListeners();
        }
    });
}

function subscribeSessionExpired(onStoreChange: () => void) {
    sessionListeners.add(onStoreChange);
    return () => {
        sessionListeners.delete(onStoreChange);
    };
}

function getSessionExpiredSnapshot() {
    return sessionExpiredAt;
}

function getServerSessionExpiredSnapshot() {
    return 0;
}

// SessionGuard: the dashboard only shows once the API confirms authentication
// and the required platform role. Unauthenticated requests are redirected to login with next.

export default function SessionGuard({
    role,
    loginUrl,
    children,
}: {
    role: "admin" | "super_admin" | "manufacturer";
    loginUrl: string;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const { data: user, isPending } = useCurrentUser();
    const allowed = !!user && user.role === role && user.status === "active";

    useEffect(() => {
        if (allowed && sessionExpiredAt > 0) {
            sessionExpiredAt = 0;
            notifySessionListeners();
        }
    }, [allowed]);

    const sessionExpiredTime = useSyncExternalStore(
        subscribeSessionExpired,
        getSessionExpiredSnapshot,
        getServerSessionExpiredSnapshot
    );

    if (sessionExpiredTime > 0 && !allowed && !isPending) {
        redirect(`${loginUrl}?next=${encodeURIComponent(pathname)}`);
    }

    if (!isPending && !allowed) {
        if (user && user.role !== role && user.status === "active") {
            redirect(getDashboardUrlForRole(user.role));
        }
        redirect(`${loginUrl}?next=${encodeURIComponent(pathname)}`);
    }

    if (!allowed) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white" role="status" aria-live="polite">
                <Loader2 className="size-6 animate-spin text-secondary-700" aria-hidden />
                <span className="sr-only">Checking you&apos;re signed in</span>
            </div>
        );
    }
    return <>{children}</>;
}
