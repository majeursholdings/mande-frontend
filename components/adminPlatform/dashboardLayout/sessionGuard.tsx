"use client";

import { Suspense, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
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
// and the required platform role. Unauthenticated requests are redirected to
// login with next: the full path and query, so a link like
// /admin/jobs?job=<code> still opens that job after logging in.

type SessionGuardProps = {
    role: "admin" | "super_admin" | "manufacturer";
    loginUrl: string;
    /**
     * Shown while the account is checked, e.g. the dashboard frame with
     * skeletons. Without one, a centred spinner (the manufacturer platform's).
     */
    fallback?: ReactNode;
    children: ReactNode;
};

/** What shows while the account is checked. */
function CheckingSession({ fallback }: { fallback?: ReactNode }) {
    if (fallback) return <>{fallback}</>;
    return (
        <div className="flex min-h-dvh items-center justify-center bg-white" role="status" aria-live="polite">
            <Loader2 className="size-6 animate-spin text-secondary-700" aria-hidden />
            <span className="sr-only">Checking you&apos;re signed in</span>
        </div>
    );
}

// Reading the query (useSearchParams) needs a Suspense boundary, or a
// prerendered page fails to build: the check shows the same fallback meanwhile.
export default function SessionGuard(props: SessionGuardProps) {
    return (
        <Suspense fallback={<CheckingSession fallback={props.fallback} />}>
            <SessionGuardInner {...props} />
        </Suspense>
    );
}

function SessionGuardInner({ role, loginUrl, fallback, children }: SessionGuardProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = searchParams.toString();
    const next = encodeURIComponent(query ? `${pathname}?${query}` : pathname);
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
        redirect(`${loginUrl}?next=${next}`);
    }

    if (!isPending && !allowed) {
        if (user && user.role !== role && user.status === "active") {
            redirect(getDashboardUrlForRole(user.role));
        }
        redirect(`${loginUrl}?next=${next}`);
    }

    if (!allowed) return <CheckingSession fallback={fallback} />;
    return <>{children}</>;
}
