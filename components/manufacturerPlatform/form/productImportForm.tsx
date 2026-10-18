"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { CSV_ACCEPT } from "@/components/form/fileRules";
import { FormSubmitButton } from "@/components/manufacturerPlatform/form/formButtons";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import type { UploadResult } from "@/lib/services/mediaService";

/** The most an import file can be: the API's limit (512kb). */
export const IMPORT_MAX_BYTES = 512 * 1024;

type ImportValues = { file: { publicId: string } | null };

// ─────────────────────────────────────────────────────────────────────────────
// ProductImportForm: choose a CSV file of products, and check it. The file
// never goes to Cloudinary: the field's `upload` reads it in the browser, and
// its text is handed to `onCheck`, which sends it to the API's import route
// (the API parses and checks every cell). Only CSV is taken, up to 512kb.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductImportForm({ onCheck, onCancel }: { onCheck: (csv: string, fileName: string) => Promise<void>; onCancel: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    // The files read so far, by the id the field keeps
    const files = useRef(new Map<string, { text: string; name: string }>());

    const readFile = async (file: File, onProgress: (percent: number) => void): Promise<UploadResult> => {
        if (file.size > IMPORT_MAX_BYTES) throw new Error("The file is over 512KB. Split it into smaller files");
        const text = await file.text();
        const publicId = `local-csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        files.current.set(publicId, { text, name: file.name });
        onProgress(100);
        return { publicId, url: "", format: "csv", bytes: file.size, resourceType: "raw" };
    };

    const fields: FormFieldConfig[] = [
        {
            name: "file",
            type: "file",
            label: "CSV file",
            description: "Save your spreadsheet as CSV (UTF-8) first. Up to 500 products and 512KB.",
            accept: CSV_ACCEPT,
            acceptCsv: true,
            silentUpload: true,
            maxSizeMB: 0.5,
            upload: (file, onProgress) => readFile(file, onProgress),
            validation: { required: "Choose a CSV file" },
        },
    ];

    const handleSubmit = async ({ file }: ImportValues) => {
        const chosen = file ? files.current.get(file.publicId) : undefined;
        if (!chosen) {
            toast.error("Choose the CSV file again.");
            return;
        }
        setIsLoading(true);
        try {
            await onCheck(chosen.text, chosen.name);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't check the file. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ImportValues>
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton label="Check file" loadingLabel="Checking..." isLoading={isLoading} disabled={!canSubmit} className="w-auto px-6" />
                </div>
            )}
        />
    );
}
