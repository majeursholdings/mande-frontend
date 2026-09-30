"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";
import AuthScreenLayout from "@/components/adminPlatform/authScreenLayout";
import { SUPER_ADMIN_AUTH } from "@/components/adminPlatform/authPlatforms";
import { queryKeys } from "@/lib/queryKeys";
import type { PublicUser } from "@/lib/services/authService";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import AcceptInviteForm from "../form/acceptInviteForm";

// ─────────────────────────────────────────────────────────────────────────────
// Super admin sign-up. There's no open sign-up: an owner or tech support
// invites them, and the invite email links here with `?invite=`. With it,
// they set a phone number and password and are signed in. Without one (or
// once it's expired or used), the page says how to get one.
// ─────────────────────────────────────────────────────────────────────────────

const LINK_CLASS = "ml-1 font-medium text-secondary-700 hover:underline cursor-pointer";

export default function SuperAdminSignUpPage({ inviteToken }: { inviteToken: string | null }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    useRedirectIfAuthenticated();
    const [isInvalid, setIsInvalid] = useState(false);
    const canAccept = inviteToken !== null && !isInvalid;

    const accepted = (user: PublicUser) => {
        queryClient.setQueryData(queryKeys.auth.profile(), user);
        toast.success("Welcome to MANDE. You're signed in.");
        router.replace(SUPER_ADMIN_AUTH.dashboardUrl);
    };

    return (
        <AuthScreenLayout
            platformLabel={SUPER_ADMIN_AUTH.label}
            title={
                canAccept ? (
                    <>
                        Welcome to <span className="text-secondary-700">Mande!</span>
                    </>
                ) : isInvalid ? (
                    "This invite can't be used"
                ) : (
                    "Super admins join by invite"
                )
            }
            description={
                canAccept
                    ? SUPER_ADMIN_AUTH.signupDescription
                    : isInvalid
                      ? "It has expired, was cancelled, or has already been used. Ask the person who invited you for a new one."
                      : "An owner or tech support invites each super admin. Open the link in your invite email to set your password."
            }
            footer={
                <>
                    Already have an account?{" "}
                    <Link href={SUPER_ADMIN_AUTH.loginUrl} className={LINK_CLASS}>
                        Login
                    </Link>
                </>
            }
        >
            {canAccept ? (
                <AcceptInviteForm token={inviteToken} onAccepted={accepted} onInvalid={() => setIsInvalid(true)} />
            ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-mist-50 p-4 text-sm font-text text-mist-600">
                    <MailOpen className="size-5 shrink-0 text-secondary-700" strokeWidth={1.75} aria-hidden />
                    Invites come from MANDE and work once, for a limited time.
                </div>
            )}
        </AuthScreenLayout>
    );
}
