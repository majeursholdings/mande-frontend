"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { superAdminService } from "@/lib/services/superAdminService";
import type { CommunityChannel } from "@/constant/community";
import { PLATFORMS } from "@/components/manufacturerPlatform/communityPage/platforms";

interface CommunityChannelsSectionProps {
    channels: CommunityChannel[];
    onChannelsUpdated: (updated: CommunityChannel[]) => void;
}

export default function CommunityChannelsSection({
    channels: initialChannels,
    onChannelsUpdated,
}: CommunityChannelsSectionProps) {
    const [channels, setChannels] = useState<CommunityChannel[]>(initialChannels);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleChannelChange = (index: number, patch: Partial<CommunityChannel>) => {
        setChannels((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const handleFeaturedChange = (featuredPlatform: string) => {
        setChannels((prev) =>
            prev.map((c) => ({
                ...c,
                isFeatured: c.platform === featuredPlatform,
            }))
        );
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const data = await superAdminService.updateCommunityChannels(channels);
            setChannels(data.channels);
            onChannelsUpdated(data.channels);
            toast.success("Community channels and links saved successfully.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to save community channels."));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSync = async () => {
        try {
            setIsSyncing(true);
            const data = await superAdminService.syncFollowerCounts();
            setChannels(data.channels);
            onChannelsUpdated(data.channels);
            toast.success("Auto-generated follower counts refreshed for all channels.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to sync follower counts."));
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
                <div>
                    <h3 className="text-base font-semibold font-text text-mist-950">
                        Social media community channels
                    </h3>
                    <p className="text-sm font-text text-mist-600">
                        Configure Mande community links. The system calculates follower/member counts and formats them across community pages.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing || isSaving}
                        className="gap-2 text-xs font-medium font-text"
                    >
                        {isSyncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        Sync follower counts
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || isSyncing}
                        className="gap-2 bg-mist-900 text-white hover:bg-mist-800 text-xs font-medium font-text"
                    >
                        {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Save changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
                {channels.map((channel, idx) => {
                    const platformConfig = PLATFORMS[channel.platform] ?? PLATFORMS.whatsapp;
                    const { name, Icon, badgeClass } = platformConfig;
                    const formattedAudience = channel.followerCountFormatted || channel.audience || "0 members";

                    return (
                        <div
                            key={channel.platform}
                            className={cn(
                                "flex flex-col gap-4 rounded-xl border p-5 transition-colors",
                                channel.isFeatured ? "border-primary-400 bg-emerald-50/20" : "border-border bg-white"
                            )}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            "flex size-10 items-center justify-center rounded-xl text-white shadow-xs shrink-0",
                                            badgeClass
                                        )}
                                    >
                                        <Icon className="size-5" />
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold font-text text-mist-950">{name}</span>
                                            {channel.isFeatured && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                                                    <Sparkles className="size-3" />
                                                    Featured Hero Channel
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-text text-mist-500">
                                            <span>Display audience:</span>
                                            <strong className="font-semibold text-mist-800">{formattedAudience}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium font-text text-mist-700">
                                        <input
                                            type="radio"
                                            name="featuredChannel"
                                            checked={Boolean(channel.isFeatured)}
                                            onChange={() => handleFeaturedChange(channel.platform)}
                                            className="accent-mist-900 size-4 cursor-pointer"
                                        />
                                        <span>Set as featured</span>
                                    </label>

                                    <div className="flex items-center gap-2 border-l border-border pl-4">
                                        <span className="text-xs font-text text-mist-600">Active</span>
                                        <Switch
                                            checked={channel.isActive !== false}
                                            onCheckedChange={(checked) => handleChannelChange(idx, { isActive: checked })}
                                            aria-label={`Toggle active for ${name}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium font-text text-mist-700">
                                        Channel / Profile Link
                                    </label>
                                    <div className="relative">
                                        <Input
                                            value={channel.href || ""}
                                            onChange={(e) => handleChannelChange(idx, { href: e.target.value })}
                                            placeholder={`https://${channel.platform}.com/...`}
                                            className="text-xs font-text pr-8"
                                        />
                                        {channel.href && (
                                            <a
                                                href={channel.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-400 hover:text-mist-700"
                                            >
                                                <ExternalLink className="size-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium font-text text-mist-700">
                                        Handle or Name
                                    </label>
                                    <Input
                                        value={channel.handle || ""}
                                        onChange={(e) => handleChannelChange(idx, { handle: e.target.value })}
                                        placeholder="@mande"
                                        className="text-xs font-text"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium font-text text-mist-700">
                                        Call To Action
                                    </label>
                                    <Input
                                        value={channel.cta || ""}
                                        onChange={(e) => handleChannelChange(idx, { cta: e.target.value })}
                                        placeholder="Follow"
                                        className="text-xs font-text"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex flex-col gap-1.5">
                                    <label className="text-xs font-medium font-text text-mist-700">
                                        Card Description
                                    </label>
                                    <Input
                                        value={channel.description || ""}
                                        onChange={(e) => handleChannelChange(idx, { description: e.target.value })}
                                        placeholder="What makers get by joining..."
                                        className="text-xs font-text"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium font-text text-mist-700">
                                        Manual Follower Override (optional)
                                    </label>
                                    <Input
                                        type="number"
                                        value={channel.manualFollowerOverride ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? null : Number(e.target.value);
                                            handleChannelChange(idx, { manualFollowerOverride: val });
                                        }}
                                        placeholder="Auto-calculated if blank"
                                        className="text-xs font-text"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
