import ProfileChangePasswordForm from "@/components/manufacturerPlatform/form/profileChangePasswordForm";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";
import SettingsSection from "../settingsSection";
import LinkedAccounts from "./linkedAccounts";
import TwoFactorSettings from "./twoFactorSettings";

export default function ManufacturerSecurityPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Security"
                description="Keep your account safe — your password, how you log in, and two-factor authentication."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <div className="flex max-w-2xl flex-col gap-6">
                <SettingsSection title="Change password">
                    <ProfileChangePasswordForm />
                </SettingsSection>
                <SettingsSection
                    title="Linked accounts"
                    description="Link your Google or Facebook account to log in with one click."
                >
                    <LinkedAccounts />
                </SettingsSection>
                <SettingsSection
                    title="Two-factor authentication"
                    description="Add a second step to confirm it's you when you log in — a code from your email or an authenticator app."
                >
                    <TwoFactorSettings />
                </SettingsSection>
            </div>
        </div>
    );
}
