"use client";

import { useState } from "react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { PENDING_VERIFICATION } from "@/constant/manufacturer";
import { FormSubmitButton } from "./formButtons";

// Named apart from the sign-up form's fields: MainForm uses field names as input ids
type NinCardReuploadFormValues = {
    ninNumberAgain: string;
    ninCardPhoto: FileList | null;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "ninNumberAgain",
        type: "text",
        label: "NIN",
        placeholder: "11-digit National Identification Number",
        inputMode: "numeric",
        autoComplete: "off",
        description: "We check it against the national records, with your name.",
        validation: {
            required: "Enter your NIN",
            validate: (value: string) => /^\d{11}$/.test(value.trim()) || "Enter your 11-digit NIN",
        },
    },
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
        uploadCategory: "profile",
        uploadVisibility: "private",
        validation: { required: "Add a photo of your NIN card" },
    },
];

/** Replaces a rejected NIN (the number and a new photo of the card) and sends it back to be checked. */
export default function NinCardReuploadForm({ onSubmitted }: { onSubmitted: () => void }) {
    const { profile, updateProfile } = useManufacturerProfile();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (values: NinCardReuploadFormValues) => {
        setIsLoading(true);
        try {
            const photoItem = Array.isArray(values.ninCardPhoto)
                ? (values.ninCardPhoto[0] as unknown)
                : (values.ninCardPhoto as unknown);
            if (!photoItem) {
                toast.error("Add a photo of your NIN card");
                return;
            }

            const imageUrl =
                photoItem && typeof photoItem === "object" && "url" in photoItem && typeof photoItem.url === "string"
                    ? photoItem.url
                    : photoItem instanceof File
                      ? URL.createObjectURL(photoItem)
                      : "";

            const publicId =
                photoItem && typeof photoItem === "object" && "publicId" in photoItem && typeof photoItem.publicId === "string"
                    ? photoItem.publicId
                    : undefined;

            await manufacturerService.submitNin({
                ninNumber: values.ninNumberAgain.trim(),
                image: publicId,
            });

            const previousUrl = profile.ninCard.imageUrl;
            updateProfile({
                ninCard: { imageUrl, ...PENDING_VERIFICATION },
            });
            if (previousUrl?.startsWith("blob:")) URL.revokeObjectURL(previousUrl);
            clearFormUploadedFiles("ninCardPhoto");
            toast.success("NIN card sent for review");
            onSubmitted();
        } catch {
            await cleanupFormFieldUploads("ninCardPhoto");
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
