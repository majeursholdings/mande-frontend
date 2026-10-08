"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ADMIN_NOTIFICATION_CHANNELS, type AdminNotificationPreferences } from "@/constant/admin";
import { staffService } from "@/lib/services/staffService";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { FormSubmitButton } from "./formButtons";
import { getErrorMessage } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationPreferencesForm — for each thing an admin (or super admin) can
// be notified about, a switch per channel (in the app, by email — and any channel added
// to ADMIN_NOTIFICATION_CHANNELS later, e.g. SMS or WhatsApp, with no change
// here). The switches wrap under the description on phones, so more channels
// still fit.
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationPreferencesForm() {
    const { profile, updateProfile } = useAdminProfile();
    const { notificationTypes } = useStaffPlatform();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminNotificationPreferences>({
        values: profile.notificationPreferences,
        resetOptions: {
            keepDirtyValues: true,
        },
    });
    const values = useWatch({ control: methods.control });
    const { isDirty } = methods.formState;

    const handleSubmit = async (preferences: AdminNotificationPreferences) => {
        setIsLoading(true);
        try {
            await staffService.updateNotifications(preferences);
            updateProfile({ notificationPreferences: preferences });
            methods.reset(preferences);
            toast.success("Notification settings saved");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save your notification settings. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
            <dl className="flex flex-col gap-1.5 rounded-lg bg-mist-100 px-4 py-3 text-xs font-text sm:flex-row sm:flex-wrap sm:gap-x-6">
                {ADMIN_NOTIFICATION_CHANNELS.map((channel) => (
                    <div key={channel.value} className="flex min-w-0 gap-1.5">
                        <dt className="font-medium text-mist-900">{channel.label}:</dt>
                        <dd className="min-w-0 wrap-anywhere text-mist-600">{channel.destination(profile)}</dd>
                    </div>
                ))}
            </dl>

            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white">
                {notificationTypes.map((type) => {
                    const isAllOff = ADMIN_NOTIFICATION_CHANNELS.every(
                        (channel) => !values[type.value]?.[channel.value],
                    );
                    return (
                        <li
                            key={type.value}
                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                        >
                            <div className="min-w-0 flex-1 font-text">
                                <p className="text-sm font-medium text-mist-950">{type.label}</p>
                                <p className="text-xs text-mist-500">{type.description}</p>
                                {isAllOff && (
                                    <p className="mt-1 text-xs text-warning-700">
                                        Off everywhere: you won&apos;t be told about these
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {ADMIN_NOTIFICATION_CHANNELS.map((channel) => (
                                    <label
                                        key={channel.value}
                                        className="flex cursor-pointer items-center gap-2 text-sm font-text text-mist-700"
                                    >
                                        <Controller
                                            control={methods.control}
                                            name={`${type.value}.${channel.value}`}
                                            render={({ field }) => (
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    aria-label={`${type.label}: ${channel.label}`}
                                                />
                                            )}
                                        />
                                        {channel.label}
                                    </label>
                                ))}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <p className="text-xs font-text text-mist-500">
                Security notices about your account, like a suggestion to turn on two-factor authentication, always arrive in the app and by email.
            </p>

            <div className="flex justify-end">
                <FormSubmitButton
                    label="Save"
                    loadingLabel="Saving..."
                    isLoading={isLoading}
                    disabled={!isDirty}
                    className="w-auto px-8"
                />
            </div>
        </form>
    );
}
