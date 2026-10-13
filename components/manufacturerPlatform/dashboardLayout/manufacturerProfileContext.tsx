"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { mapApiProfileToManufacturerProfile, type ApiProfilePayload } from "@/lib/mappers/profileMappers";
import {
    EMPTY_MANUFACTURER_PROFILE,
    type ManufacturerProfile,
    type ManufacturerSecurity,
} from "@/constant/manufacturer";

// The signed-in manufacturer's profile, shared by the top bars, the profile
// page and the edit profile forms so a saved change (a new name, photo or
// company detail) shows everywhere at once. What's shown is always what the
// API last answered: a save writes the API's answer into the query cache (or
// refetches it), so nothing is kept on the side.

/** GET /profile, and every /profile save, answers with the whole profile. */
type ProfileResponse = { profile?: ApiProfilePayload };

type ManufacturerProfileContextValue = {
    profile: ManufacturerProfile;
    isLoading: boolean;
    /** True when the profile couldn't load. */
    isError: boolean;
    /** Shows a /profile route's answer (`{ profile }`) everywhere, without refetching. */
    applyProfileResponse: (response: unknown) => void;
    /** Shows a /kyc route's answer (`{ kyc }`) in the profile, without refetching. */
    applyKycResponse: (response: unknown) => void;
    /**
     * Refetches the profile from the API after a save. The changes passed in
     * aren't shown on their own: the API's answer is (kept for callers that
     * pass what they saved).
     */
    updateProfile: (changes?: Partial<ManufacturerProfile>) => void;
    /**
     * Shows a security change the API has confirmed (e.g. two-factor turned on
     * or off). Only `twoFactorMethod` is kept: it's the only setting the API has.
     */
    updateSecurity: (update: (security: ManufacturerSecurity) => ManufacturerSecurity) => void;
    refetchProfile: () => void;
};

const ManufacturerProfileContext = createContext<ManufacturerProfileContextValue | null>(null);

const hasProfile = (value: unknown): value is { profile: ApiProfilePayload } =>
    !!value && typeof value === "object" && "profile" in value && !!(value as { profile: unknown }).profile;

export function ManufacturerProfileProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: queryKeys.profile.details(),
        queryFn: () => manufacturerService.getProfile(),
        staleTime: 60_000,
    });

    const profile = useMemo(
        () => mapApiProfileToManufacturerProfile(data, EMPTY_MANUFACTURER_PROFILE),
        [data]
    );

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profile.details() });
    }, [queryClient]);

    const applyProfileResponse = useCallback(
        (response: unknown) => {
            if (hasProfile(response)) {
                queryClient.setQueryData<ProfileResponse>(queryKeys.profile.details(), { profile: response.profile });
            } else {
                invalidate();
            }
        },
        [queryClient, invalidate],
    );

    const applyKycResponse = useCallback(
        (response: unknown) => {
            const kyc =
                response && typeof response === "object" && "kyc" in response
                    ? ((response as { kyc: ApiProfilePayload["kyc"] }).kyc ?? null)
                    : null;
            const current = queryClient.getQueryData<ProfileResponse>(queryKeys.profile.details());
            if (kyc && hasProfile(current)) {
                queryClient.setQueryData<ProfileResponse>(queryKeys.profile.details(), {
                    ...current,
                    profile: { ...current.profile, kyc },
                });
            } else {
                invalidate();
            }
        },
        [queryClient, invalidate],
    );

    const updateProfile = useCallback(() => invalidate(), [invalidate]);

    const updateSecurity = useCallback(
        (update: (security: ManufacturerSecurity) => ManufacturerSecurity) => {
            const current = queryClient.getQueryData<ProfileResponse>(queryKeys.profile.details());
            if (!hasProfile(current)) {
                invalidate();
                return;
            }
            const security = mapApiProfileToManufacturerProfile(current, EMPTY_MANUFACTURER_PROFILE).security;
            const { twoFactorMethod } = update(security);
            queryClient.setQueryData<ProfileResponse>(queryKeys.profile.details(), {
                ...current,
                profile: { ...current.profile, twoFactorMethod },
            });
        },
        [queryClient, invalidate],
    );

    const refetchProfile = useCallback(() => {
        void refetch();
    }, [refetch]);

    const value: ManufacturerProfileContextValue = useMemo(
        () => ({
            profile,
            isLoading,
            isError,
            applyProfileResponse,
            applyKycResponse,
            updateProfile,
            updateSecurity,
            refetchProfile,
        }),
        [profile, isLoading, isError, applyProfileResponse, applyKycResponse, updateProfile, updateSecurity, refetchProfile],
    );

    return <ManufacturerProfileContext.Provider value={value}>{children}</ManufacturerProfileContext.Provider>;
}

export function useManufacturerProfile() {
    const context = useContext(ManufacturerProfileContext);
    if (!context) {
        throw new Error("useManufacturerProfile must be used within a ManufacturerProfileProvider");
    }
    return context;
}
