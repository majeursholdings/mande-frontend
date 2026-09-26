"use client";

import { useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/manufacturerPlatform/dashboardLayout/userAvatar";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { getManufacturerFullName } from "@/constant/manufacturer";

const AVATAR_ACCEPT = "image/png, image/jpeg, image/webp";
const AVATAR_MAX_SIZE_MB = 5;

// ─────────────────────────────────────────────────────────────────────────────
// ProfileAvatarUploadForm — the edit page's "click image to upload" avatar.
// Picking a photo uploads it straight away (there's no Save button for it);
// MainForm's image field is a dropzone with a preview grid, which doesn't fit
// a single round avatar, so this is a plain file input behind the photo.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileAvatarUploadForm() {
    const { profile, updateProfile } = useManufacturerProfile();
    const [isUploading, setIsUploading] = useState(false);

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
        try {
            // No backend is wired up yet — simulate the upload and show the
            // chosen file from a local object URL until the API returns one.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const previousUrl = profile.avatarUrl;
            updateProfile({ avatarUrl: URL.createObjectURL(file) });
            if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
            toast.success("Profile photo updated successfully");
        } catch {
            toast.error("Couldn't upload your photo. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <label
                className={cn(
                    "relative rounded-full ring-offset-2 has-focus-visible:ring-2 has-focus-visible:ring-secondary-300",
                    isUploading ? "cursor-wait" : "cursor-pointer",
                )}
            >
                <UserAvatar
                    name={getManufacturerFullName(profile)}
                    src={profile.avatarUrl}
                    className="size-32 text-3xl"
                />
                <span className="absolute right-0 bottom-0 flex size-10 items-center justify-center rounded-full bg-white text-secondary-600 shadow-md">
                    <Camera className="size-5" strokeWidth={1.75} />
                </span>
                {isUploading && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="size-6 animate-spin text-white" />
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
