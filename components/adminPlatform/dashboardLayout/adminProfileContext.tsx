"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AdminProfile } from "@/constant/admin";
import { useStaffPlatform } from "./staffPlatformContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminProfileProvider — the signed-in admin's profile (or the super
// admin's, on their platform), shared by the top bars, the profile page,
// settings and security, so a saved change (a phone number, a photo,
// two-factor) shows everywhere at once. Their email isn't in `updateProfile`,
// and an admin's name is only changed by a super admin (a super admin can
// change their own, from Edit profile). Seeded from sample
// data and updated locally for now; once the backend is connected, load the
// profile from the API and persist updates there.
// ─────────────────────────────────────────────────────────────────────────────

type EditableProfile = Pick<
    AdminProfile,
    "firstName" | "lastName" | "phone" | "avatarUrl" | "security" | "notificationPreferences"
>;

type AdminProfileContextValue = {
    profile: AdminProfile;
    /** The admin's full name — firstName and lastName. */
    fullName: string;
    updateProfile: (changes: Partial<EditableProfile>) => void;
};

const AdminProfileContext = createContext<AdminProfileContextValue | null>(null);

export function AdminProfileProvider({ children }: { children: ReactNode }) {
    const { profile: initialProfile } = useStaffPlatform();
    const [profile, setProfile] = useState(initialProfile);

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
