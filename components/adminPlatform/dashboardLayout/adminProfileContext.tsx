"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AdminProfile } from "@/constant/admin";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useStaffPlatform } from "./staffPlatformContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminProfileProvider — the signed-in admin's profile (or the super
// admin's, on their platform), shared by the top bars, the profile page,
// settings and security, so a saved change (a phone number, a photo,
// two-factor) shows everywhere at once. Their email isn't in `updateProfile`,
// and an admin's name is only changed by a super admin (a super admin can
// change their own, from Edit profile).
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
    const { data: currentUser } = useCurrentUser();
    const [overrides, setOverrides] = useState<Partial<EditableProfile>>({});

    const profile = useMemo(() => {
        const p = (currentUser?.profile || {}) as {
            firstName?: string;
            lastName?: string;
            phone?: string;
            position?: string;
            avatar?: string | { url?: string | null } | null;
            avatarUrl?: string | null;
            notificationPreferences?: AdminProfile["notificationPreferences"];
        };
        const resolvedAvatarUrl =
            overrides.avatarUrl !== undefined
                ? overrides.avatarUrl
                : p.avatarUrl ?? (typeof p.avatar === "string" ? p.avatar : p.avatar?.url) ?? initialProfile.avatarUrl;
        return {
            ...initialProfile,
            firstName: overrides.firstName ?? p.firstName ?? initialProfile.firstName,
            lastName: overrides.lastName ?? p.lastName ?? initialProfile.lastName,
            email: currentUser?.email ?? initialProfile.email,
            phone: overrides.phone ?? p.phone ?? initialProfile.phone,
            position: ((p.position as AdminProfile["position"]) ?? initialProfile.position),
            avatarUrl: resolvedAvatarUrl,
            security: {
                twoFactorMethod: currentUser?.twoFactorMethod ?? initialProfile.security?.twoFactorMethod,
            },
            notificationPreferences: overrides.notificationPreferences ?? p.notificationPreferences ?? initialProfile.notificationPreferences,
        };
    }, [initialProfile, currentUser, overrides]);

    const updateProfile = (changes: Partial<EditableProfile>) =>
        setOverrides((current) => ({ ...current, ...changes }));

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
