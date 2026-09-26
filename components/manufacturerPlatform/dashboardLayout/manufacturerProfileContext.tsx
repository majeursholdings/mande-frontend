"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    MANUFACTURER_PROFILE,
    type ManufacturerProfile,
    type ManufacturerSecurity,
} from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerProfileProvider — the signed-in manufacturer's profile, shared by
// the top bars, the profile page and the edit profile forms so a saved change
// (a new name, photo or company detail) shows everywhere at once. Seeded from
// sample data and updated locally for now; once the backend is connected,
// start from EMPTY_MANUFACTURER_PROFILE, load the profile from the API, and
// persist updates there.
// ─────────────────────────────────────────────────────────────────────────────

type ManufacturerProfileContextValue = {
    profile: ManufacturerProfile;
    updateProfile: (changes: Partial<ManufacturerProfile>) => void;
    /** Updates security settings from their latest value — safe to call after an await. */
    updateSecurity: (update: (security: ManufacturerSecurity) => ManufacturerSecurity) => void;
};

const ManufacturerProfileContext = createContext<ManufacturerProfileContextValue | null>(null);

export function ManufacturerProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState(MANUFACTURER_PROFILE);

    const updateProfile = (changes: Partial<ManufacturerProfile>) =>
        setProfile((current) => ({ ...current, ...changes }));

    const updateSecurity = (update: (security: ManufacturerSecurity) => ManufacturerSecurity) =>
        setProfile((current) => ({ ...current, security: update(current.security) }));

    return (
        <ManufacturerProfileContext.Provider value={{ profile, updateProfile, updateSecurity }}>
            {children}
        </ManufacturerProfileContext.Provider>
    );
}

export function useManufacturerProfile() {
    const context = useContext(ManufacturerProfileContext);
    if (!context) {
        throw new Error("useManufacturerProfile must be used within a ManufacturerProfileProvider");
    }
    return context;
}
