"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import { LoadError } from "@/components/adminPlatform/emptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { superAdminService } from "@/lib/services/superAdminService";
import CommunityChannelsSection from "../community/communityChannelsSection";
import CommunityTestimonialsSection from "../community/communityTestimonialsSection";
import type { AdminCommunityData } from "@/constant/superAdmin";

export default function CommunityTab() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, refetch } = useQuery<AdminCommunityData>({
        queryKey: ["admin-community"],
        queryFn: () => superAdminService.getCommunityData(),
    });

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-96" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return <LoadError message="We couldn't load the community settings. Please refresh the page." />;
    }

    const handleChannelsUpdated = (updatedChannels: typeof data.channels) => {
        queryClient.setQueryData(["admin-community"], {
            ...data,
            channels: updatedChannels,
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <SettingsSection
                headingLevel="h3"
                title="Community Channels"
                description="Social channels configured for Mande. Follower numbers are automatically synced or can be customized."
            >
                <CommunityChannelsSection
                    channels={data.channels}
                    onChannelsUpdated={handleChannelsUpdated}
                />
            </SettingsSection>

            <SettingsSection
                headingLevel="h3"
                title="Testimonials & Praise"
                description="What makers say across external social media and real 5-star job sign-offs on Mande."
            >
                <CommunityTestimonialsSection
                    testimonials={data.testimonials}
                    candidateReviews={data.candidateReviews || []}
                    onRefresh={() => refetch()}
                />
            </SettingsSection>
        </div>
    );
}
