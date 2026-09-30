import type { Metadata } from "next";
import SuperAdminSignUpPage from "@/components/superAdminPlatform/signUpPage";

// The invite token is in this page's address: never send it on to another site
export const metadata: Metadata = { title: "Super admin sign up | MANDE", referrer: "no-referrer" };

/** An invite link's token: URL-safe base64, as the API makes them. Anything else isn't one. */
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;

// Super admins join from an invite link (?invite=...), not an open sign-up
export default async function SuperAdminSignUpRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { invite } = await searchParams;
    const token = typeof invite === "string" && INVITE_TOKEN_PATTERN.test(invite) ? invite : null;
    return <SuperAdminSignUpPage inviteToken={token} />;
}
