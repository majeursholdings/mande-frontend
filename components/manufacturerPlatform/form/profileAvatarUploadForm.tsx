"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { getManufacturerFullName } from "@/constant/manufacturer";
import { DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { mediaService } from "@/lib/services/mediaService";

const AVATAR_ACCEPT = "image/png, image/jpeg, image/webp";
const AVATAR_MAX_SIZE_MB = DEFAULT_MAX_FILE_SIZE_MB;

// ─────────────────────────────────────────────────────────────────────────────
// ProfileAvatarUploadForm — the edit page's "click image to upload" avatar.
// Picking a photo uploads it straight away (there's no Save button for it);
// MainForm's image field is a dropzone with a preview grid, which doesn't fit
// a single round avatar, so this is a plain file input behind the photo.
// ─────────────────────────────────────────────────────────────────────────────

import { manufacturerService } from "@/lib/services/manufacturerService";

/** The signed-in manufacturer's profile photo. */
export default function ProfileAvatarUploadForm() {
    const { profile, updateProfile, isLoading } = useManufacturerProfile();
    return (
        <AvatarUploadForm
            loading={isLoading}
            name={getManufacturerFullName(profile)}
            avatarUrl={profile.avatarUrl}
            onUploaded={async (avatarUrl, publicId) => {
                let savedUrl = avatarUrl;
                if (publicId) {
                    try {
                        const res = await manufacturerService.setAvatar(publicId);
                        if (res?.profile?.avatar?.url || res?.profile?.avatarUrl) {
                            savedUrl = res.profile.avatar?.url ?? res.profile.avatarUrl;
                        }
                    } catch (e) {
                        console.error("Failed to sync avatar to backend:", e);
                        throw e;
                    }
                }
                updateProfile({ avatarUrl: savedUrl });
            }}
        />
    );
}

/** ProfileAvatarUploadForm for any account — e.g. an admin's. */
export function AvatarUploadForm({
    name,
    avatarUrl,
    onUploaded,
    loading = false,
}: {
    /** For the initials avatar while there's no photo. */
    name: string;
    avatarUrl: string | null;
    onUploaded: (avatarUrl: string, publicId?: string) => void | Promise<void>;
    /** A skeleton in place of the photo while it loads. */
    loading?: boolean;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Clear the input so choosing the same file again still fires onChange
        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file");
            return;
        }
        if (file.size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Image must be ${AVATAR_MAX_SIZE_MB}MB or smaller`);
            return;
        }

        setIsUploading(true);
        setProgress(0);
        try {
            const res = await mediaService.uploadFile(file, "avatar", (p) => setProgress(p));
            await onUploaded(res.url, res.publicId);
            toast.success("Profile photo updated successfully");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
                (err as Error)?.message ||
                "Couldn't upload your photo. Please try again.";
            toast.error(message);
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="size-32 rounded-full" />
                <p className="text-xs font-text text-mist-500">Click image to upload new avatar</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <label
                className={cn(
                    "relative rounded-full ring-offset-2 has-focus-visible:ring-2 has-focus-visible:ring-secondary-300",
                    isUploading ? "cursor-wait" : "cursor-pointer",
                )}
            >
                <UserAvatar name={name} src={avatarUrl} className="size-32 text-3xl" />
                <span className="absolute right-0 bottom-0 flex size-10 items-center justify-center rounded-full bg-white text-secondary-600 shadow-md">
                    <Camera className="size-5" strokeWidth={1.75} />
                </span>
                {isUploading && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white">
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-[10px] font-semibold mt-1">{progress}%</span>
                    </span>
                )}
                <input
                    type="file"
                    accept={AVATAR_ACCEPT}
                    aria-label="Upload new avatar"
                    disabled={isUploading}
                    onChange={handleFileChange}
                    className="sr-only"
                />
            </label>
            <p className="text-xs font-text text-mist-500">Click image to upload new avatar</p>
        </div>
    );
}
