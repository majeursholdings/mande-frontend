"use client";

import { Bell, UserRound } from "lucide-react";
import { AvatarUploadForm } from "@/components/manufacturerPlatform/form/profileAvatarUploadForm";
import Notice from "@/components/manufacturerPlatform/notice";
import SettingsTabs, { type SettingsTab } from "@/components/manufacturerPlatform/settingsTabs";
import AdminBasicInfoForm from "@/components/adminPlatform/form/adminBasicInfoForm";
import NotificationPreferencesForm from "@/components/adminPlatform/form/notificationPreferencesForm";
import { staffService } from "@/lib/services/staffService";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import AdminPageHeader from "../pageHeader";

type SettingsTabValue = "basic-info" | "notifications";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Settings — laid out like the manufacturer's (see SettingsTabs): their
// photo, then Basic Info (name, email and position fixed; the phone number
// theirs to change) and how they're told about each kind of notification.
// A super admin's Edit profile too, where the name is theirs to change (their
// Settings are the platform's).
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage({ initialTab }: { initialTab?: string }) {
    const { profile, fullName, updateProfile } = useAdminProfile();
    const { profileUrl, permissions } = useStaffPlatform();
    const { managesPlatform } = permissions;

    const tabs: SettingsTab<SettingsTabValue>[] = [
        {
            value: "basic-info",
            label: "Basic Info",
            icon: UserRound,
            panel: (
                <>
                    <Notice>
                        {managesPlatform
                            ? "Your email is how you log in, so it can't be changed here."
                            : "Your name, email and position come from your Mande staff account, so you can't change them here. Ask a super admin if any of them are wrong."}
                    </Notice>
                    <AdminBasicInfoForm />
                </>
            ),
        },
        {
            value: "notifications",
            label: "Notifications",
            icon: Bell,
            panel: (
                <>
                    <p className="-mt-3 text-sm font-text text-mist-500">
                        Choose how you hear about each of these: in the app, by email, or both.
                    </p>
                    <NotificationPreferencesForm />
                </>
            ),
        },
    ];
    // e.g. ?tab=notifications
    const defaultTab = tabs.find((tab) => tab.value === initialTab)?.value ?? tabs[0].value;

    return (
        <div className="flex flex-col gap-6 lg:gap-10">
            <AdminPageHeader
                title={managesPlatform ? "Edit profile" : "Settings"}
                backLink={{ href: profileUrl, label: "Back to Profile" }}
            />
            <SettingsTabs
                label="Settings sections"
                header={
                    <AvatarUploadForm
                        name={fullName}
                        avatarUrl={profile.avatarUrl}
                        onUploaded={async (avatarUrl, publicId) => {
                            let savedUrl = avatarUrl;
                            if (publicId) {
                                try {
                                    const res = await staffService.setAvatar(publicId);
                                    if (res?.profile?.avatarUrl) {
                                        savedUrl = res.profile.avatarUrl;
                                    }
                                } catch (e) {
                                    console.error("Failed to sync avatar to backend:", e);
                                    throw e;
                                }
                            }
                            updateProfile({ avatarUrl: savedUrl });
                        }}
                    />
                }
                tabs={tabs}
                defaultValue={defaultTab}
            />
        </div>
    );
}
