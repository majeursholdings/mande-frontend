"use client";

import { ChangePasswordForm } from "@/components/manufacturerPlatform/form/profileChangePasswordForm";
import { TwoFactorMethods } from "@/components/manufacturerPlatform/securityPage/twoFactorSettings";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import AdminPageHeader from "../pageHeader";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Security — the manufacturer's Security page, less linked accounts
// (admins only log in with their Mande email): change the password, and
// turn two-factor authentication on, off, or over to another method. Both
// confirm with a code first.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
    const { profile, updateProfile } = useAdminProfile();
    const { twoFactorMethod } = profile.security;
    const { profileUrl, roleLabel } = useStaffPlatform();

    return (
        <div className="flex flex-col gap-8">
            <AdminPageHeader
                title="Security"
                description={`Keep your ${roleLabel.toLowerCase()} account safe: your password, and a second step when you log in.`}
                backLink={{ href: profileUrl, label: "Back to Profile" }}
            />

            <div className="flex max-w-2xl flex-col gap-6">
                <SettingsSection title="Change password">
                    <ChangePasswordForm
                        email={profile.email}
                        codeChannel={twoFactorMethod === "app" ? "app" : "email"}
                    />
                </SettingsSection>
                <SettingsSection
                    title="Two-factor authentication"
                    description="Add a second step to confirm it's you when you log in: a code from your email or an authenticator app."
                >
                    <TwoFactorMethods
                        email={profile.email}
                        activeMethod={twoFactorMethod}
                        onChange={(method) => updateProfile({ security: { twoFactorMethod: method } })}
                    />
                </SettingsSection>
            </div>
        </div>
    );
}
