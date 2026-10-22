"use client";

import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDashboardUrlForRole } from "@/hooks/useAuthRedirect";
import { hasSignedInHint } from "@/lib/api";

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

function subscribeSignedInHint(onStoreChange: () => void) {
    window.addEventListener("mande:auth_token_changed", onStoreChange);
    return () => window.removeEventListener("mande:auth_token_changed", onStoreChange);
}

/**
 * What shows while the account is checked: the fallback only when this tab
 * was signed in, so a visit without a login shows a blank screen, never a
 * dashboard, before it's sent to log in.
 */
function CheckingSession({ fallback }: { fallback?: ReactNode }) {
    const signedIn = useSyncExternalStore(subscribeSignedInHint, hasSignedInHint, () => false);
    if (!signedIn) {
        return (
            <div className="min-h-dvh bg-white" role="status" aria-live="polite">
                <span className="sr-only">Checking you&apos;re signed in</span>
            </div>
        );
    }
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

    const sessionExpiredTime = useSyncExternalStore(
        subscribeSessionExpired,
        getSessionExpiredSnapshot,
        getServerSessionExpiredSnapshot
    );

    // The API turned the login down (no refresh cookie, or it's ended): off to
    // log in at once, without waiting for the profile call to fail too. A new
    // login sets a token, which clears this.
    if (sessionExpiredTime > 0 && !allowed) {
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
