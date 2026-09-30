"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { redirect, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDashboardUrlForRole } from "@/hooks/useAuthRedirect";

let sessionExpiredAt = 0;
if (typeof window !== "undefined") {
    window.addEventListener("mande:session-expired", () => {
        sessionExpiredAt = Date.now();
    });
}

function subscribeSessionExpired(onStoreChange: () => void) {
    window.addEventListener("mande:session-expired", onStoreChange);
    return () => window.removeEventListener("mande:session-expired", onStoreChange);
}

function getSessionExpiredSnapshot() {
    return sessionExpiredAt;
}

function getServerSessionExpiredSnapshot() {
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SessionGuard — the dashboard only shows once the API says who's signed in
// (from the access token, or the refresh cookie after a reload) and that
// they have the platform's role. Anyone else goes to its log in, which
// brings them back here after. A convenience, not the security: the API
// checks every request itself.
// ─────────────────────────────────────────────────────────────────────────────

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

    const sessionExpiredTime = useSyncExternalStore(
        subscribeSessionExpired,
        getSessionExpiredSnapshot,
        getServerSessionExpiredSnapshot
    );

    if (sessionExpiredTime > 0) {
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
