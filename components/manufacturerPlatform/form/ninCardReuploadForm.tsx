"use client";

import { useState } from "react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { PENDING_VERIFICATION } from "@/constant/manufacturer";
import { FormSubmitButton } from "./formButtons";

// Named apart from the sign-up form's "ninCard" — MainForm uses field names as input ids
type NinCardReuploadFormValues = {
    ninCardPhoto: FileList | null;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "ninCardPhoto",
        type: "image",
        label: "NIN card",
        description:
            "Snap the front of your National Identification Number card, with all four corners in view. JPG or PNG, up to 5MB.",
        accept: "image/*",
        // Opens the back camera on phones, so the card can be snapped there and then
        capture: "environment",
        maxFiles: 1,
        maxSizeMB: 5,
        validation: { required: "Add a photo of your NIN card" },
    },
];

/** Replaces a rejected NIN card with a new photo and sends it back for review. */
export default function NinCardReuploadForm({ onSubmitted }: { onSubmitted: () => void }) {
    const { profile, updateProfile } = useManufacturerProfile();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async ({ ninCardPhoto }: NinCardReuploadFormValues) => {
        setIsLoading(true);
        try {
            const file = ninCardPhoto?.[0];
            if (!file) {
                toast.error("Add a photo of your NIN card");
                return;
            }

            // No backend is wired up yet — simulate the upload and show the
            // chosen file from a local object URL until the API returns one.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const previousUrl = profile.ninCard.imageUrl;
            updateProfile({
                ninCard: { imageUrl: URL.createObjectURL(file), ...PENDING_VERIFICATION },
            });
            if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
            toast.success("NIN card sent for review");
            onSubmitted();
        } catch {
            toast.error("Couldn't upload your NIN card. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<NinCardReuploadFormValues>
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Submit for review"
                    loadingLabel="Uploading..."
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="w-full"
                />
            )}
        />
    );
}
