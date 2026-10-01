"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { mapApiProfileToManufacturerProfile } from "@/lib/mappers/profileMappers";
import {
    EMPTY_MANUFACTURER_PROFILE,
    type ManufacturerProfile,
    type ManufacturerSecurity,
} from "@/constant/manufacturer";

// The signed-in manufacturer's profile, shared by
// the top bars, the profile page and the edit profile forms so a saved change
// (a new name, photo or company detail) shows everywhere at once.
// Loaded from the API with live state synchronization.

type ManufacturerProfileContextValue = {
    profile: ManufacturerProfile;
    isLoading: boolean;
    updateProfile: (changes: Partial<ManufacturerProfile>) => void;
    /** Updates security settings from their latest value - safe to call after an await. */
    updateSecurity: (update: (security: ManufacturerSecurity) => ManufacturerSecurity) => void;
    refetchProfile: () => void;
};

const ManufacturerProfileContext = createContext<ManufacturerProfileContextValue | null>(null);

export function ManufacturerProfileProvider({ children }: { children: ReactNode }) {
    const [overrides, setOverrides] = useState<Partial<ManufacturerProfile>>({});
    const [securityOverrides, setSecurityOverrides] = useState<Partial<ManufacturerSecurity>>({});

    const { data, isLoading, refetch } = useQuery({
        queryKey: queryKeys.profile.details(),
        queryFn: () => manufacturerService.getProfile(),
        staleTime: 60_000,
    });

    const baseProfile = useMemo(
        () => mapApiProfileToManufacturerProfile(data, EMPTY_MANUFACTURER_PROFILE),
        [data]
    );

    const profile: ManufacturerProfile = useMemo(() => {
        return {
            ...baseProfile,
            ...overrides,
            security: {
                ...baseProfile.security,
                ...securityOverrides,
            },
        };
    }, [baseProfile, overrides, securityOverrides]);

    const updateProfile = (changes: Partial<ManufacturerProfile>) =>
        setOverrides((current) => ({ ...current, ...changes }));

    const updateSecurity = (update: (security: ManufacturerSecurity) => ManufacturerSecurity) =>
        setSecurityOverrides((current) => update({ ...baseProfile.security, ...current }));

    return (
        <ManufacturerProfileContext.Provider
            value={{
                profile,
                isLoading,
                updateProfile,
                updateSecurity,
                refetchProfile: () => {
                    void refetch();
                },
            }}
        >
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
