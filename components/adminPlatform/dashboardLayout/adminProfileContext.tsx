"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ADMIN_PROFILE, type AdminProfile } from "@/constant/admin";

// ─────────────────────────────────────────────────────────────────────────────
// AdminProfileProvider — the signed-in admin's profile, shared by the top
// bars, the profile page, settings and security, so a saved change (a phone
// number, a photo, two-factor) shows everywhere at once. Their name and email
// aren't in `updateProfile` — only a super admin can change those. Seeded
// from sample data and updated locally for now; once the backend is
// connected, load the profile from the API and persist updates there.
// ─────────────────────────────────────────────────────────────────────────────

type EditableProfile = Pick<AdminProfile, "phone" | "avatarUrl" | "security" | "notificationPreferences">;

type AdminProfileContextValue = {
    profile: AdminProfile;
    /** The admin's full name — firstName and lastName. */
    fullName: string;
    updateProfile: (changes: Partial<EditableProfile>) => void;
};

const AdminProfileContext = createContext<AdminProfileContextValue | null>(null);

export function AdminProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState(ADMIN_PROFILE);

    const updateProfile = (changes: Partial<EditableProfile>) =>
        setProfile((current) => ({ ...current, ...changes }));

    return (
        <AdminProfileContext.Provider
            value={{ profile, fullName: `${profile.firstName} ${profile.lastName}`, updateProfile }}
        >
            {children}
        </AdminProfileContext.Provider>
    );
}

export function useAdminProfile() {
    const context = useContext(AdminProfileContext);
    if (!context) throw new Error("useAdminProfile must be used within an AdminProfileProvider");
    return context;
}
