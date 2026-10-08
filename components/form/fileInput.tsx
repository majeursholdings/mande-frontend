"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
    useFormContext,
    type Control,
    type FieldValues,
    type Path,
    type PathValue,
    type RegisterOptions,
    type UseFormRegister,
    type UseFormSetValue,
} from "react-hook-form";
import { toast } from "sonner";
import {
    CheckCircle2,
    Loader2,
    X,
    FileText,
    Ban,
    AlertCircle,
    Image as ImageIcon,
    Upload as UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
    generateRenamedFileName,
    resolveUserUploadInfo,
    type CloudinaryUploadResult,
} from "@/lib/services/cloudinaryService";
import { mediaService, type UploadPurpose } from "@/lib/services/mediaService";
import {
    DEFAULT_MAX_FILE_SIZE_MB,
    DOCUMENT_ACCEPT,
    IMAGE_ACCEPT,
    isImageFile,
    getFileKindError,
} from "./fileRules";
import type { FormFieldConfig } from "./types";

export interface FileItemState {
    id: string; // client unique ID
    file: File;
    renamedName: string;
    originalName: string;
    size: number;
    status: "idle" | "uploading" | "completed" | "error" | "cancelled";
    progress: number;
    previewUrl: string | null;
    error?: string;
    cancelUpload?: () => void;
    uploaded?: CloudinaryUploadResult;
}

export type FileInputProps<T extends FieldValues = FieldValues> = {
    field: FormFieldConfig;
    register: UseFormRegister<T>;
    error?: string;
    control?: Control<T>;
    getValues?: () => T;
    setValue?: UseFormSetValue<T>;
};

// Global registry of uploaded files by form field, used for cleanup on form failure
export const activeFormUploadsRegistry = new Map<string, CloudinaryUploadResult[]>();

export function getFormUploadedFiles(fieldName: string): CloudinaryUploadResult[] {
    return activeFormUploadsRegistry.get(fieldName) || [];
}

export function clearFormUploadedFiles(fieldName: string): void {
    activeFormUploadsRegistry.delete(fieldName);
}

/** Marks an upload signed by the API (see FormFieldConfig.uploadPurpose). */
const API_UPLOAD_CATEGORY_PREFIX = "api:";

/** Uploads `file` through the API's signed media flow, in the shape a form keeps it. */
function uploadFileThroughApi(
    file: File,
    purpose: UploadPurpose,
    onProgress: (percent: number) => void,
): { promise: Promise<CloudinaryUploadResult>; cancel: () => void } {
    const controller = new AbortController();
    const category = `${API_UPLOAD_CATEGORY_PREFIX}${purpose}`;
    const promise = mediaService
        .uploadFile(file, purpose, onProgress, controller.signal)
        .then((result) => ({
            id: result.publicId,
            publicId: result.publicId,
            url: result.url,
            name: file.name,
            originalName: file.name,
            format: result.format ?? "",
            bytes: result.bytes ?? file.size,
            resourceType: (result.resourceType === "raw" ? "raw" : "image") as CloudinaryUploadResult["resourceType"],
            category,
            metadata: { id: result.publicId, date: new Date().toISOString(), source: "api", category, originalName: file.name },
        }))
        .catch((err: unknown) => {
            throw controller.signal.aborted ? new Error("Upload cancelled") : err;
        });
    return { promise, cancel: () => controller.abort() };
}

/**
 * Forgets a field's uploads after a failed submit. Nothing is deleted: the
 * app can't remove files (only the API holds the Cloudinary secret), and a
 * file the API never claimed isn't attached to anything.
 */
export async function cleanupFormFieldUploads(fieldName: string): Promise<void> {
    activeFormUploadsRegistry.delete(fieldName);
}

export const FileInput = <T extends FieldValues = FieldValues>({
    field,
    register,
    error,
    setValue,
}: FileInputProps<T>) => {
    const formContext = useFormContext<T>();
    const setValueFn = setValue ?? formContext?.setValue;

    const { data: currentUser } = useCurrentUser();

    const [items, setItems] = useState<FileItemState[]>([]);
    const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Only the ref and name go on the <input>. The field's value is the
    // uploaded files (set in syncFormValue), never the input's FileList: the
    // registered onChange/onBlur read the DOM and would replace it with that.
    const { ref, name } = register(
        field.name as Path<T>,
        field.validation as RegisterOptions<T, Path<T>>,
    );

    const defaultIcon =
        field.type === "image" ? (
            <ImageIcon className="size-5 text-[#9CA3AF]" />
        ) : (
            <UploadIcon className="size-5 text-[#9CA3AF]" />
        );

    const icon = field.uploadIcon ?? defaultIcon;

    const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

    const isSameFile = (a: File, b: File) =>
        a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

    // Validate size and MIME
    const validateFile = (file: File): string | null => {
        const maxSizeMB = field.maxSizeMB ?? DEFAULT_MAX_FILE_SIZE_MB;
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `Exceeds ${maxSizeMB}MB limit (${sizeMB.toFixed(1)}MB)`;
        }

        const kindError = getFileKindError(file, field.type === "image" ? "image" : "file");
        if (kindError) return kindError;

        const acceptStr = field.accept;
        if (acceptStr) {
            const tokens = acceptStr.split(",").map((t: string) => t.trim().toLowerCase());
            const fileMime = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();

            const matches = tokens.some((token: string) => {
                if (token.startsWith(".")) {
                    return fileName.endsWith(token);
                }
                if (token.endsWith("/*")) {
                    const prefix = token.slice(0, -2);
                    return fileMime.startsWith(prefix);
                }
                return fileMime === token;
            });

            if (!matches) {
                return `Unsupported format (${file.type || "file"})`;
            }
        }

        return null;
    };

    // Synchronize react-hook-form value with completed uploads
    const syncFormValue = useCallback((currentItems: FileItemState[]) => {
        const completedUploads = currentItems
            .filter((item) => item.status === "completed" && item.uploaded)
            .map((item) => item.uploaded!);

        // Update registry for cleanup
        activeFormUploadsRegistry.set(field.name, completedUploads);

        if (setValueFn) {
            if (field.multiple) {
                setValueFn(field.name as Path<T>, completedUploads as unknown as PathValue<T, Path<T>>, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                });
            } else {
                setValueFn(field.name as Path<T>, (completedUploads[0] ?? null) as unknown as PathValue<T, Path<T>>, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                });
            }
        }

        // Also keep the input's files in step (for the browser only: the
        // form's value stays the uploads set above)
        if (inputRef.current) {
            try {
                const dt = new DataTransfer();
                currentItems
                    .filter((item) => item.status === "completed" || item.status === "uploading")
                    .forEach((item) => dt.items.add(item.file));
                inputRef.current.files = dt.files;
            } catch {
                // Ignore environment restrictions
            }
        }
    }, [field.name, field.multiple, setValueFn]);

    // The form's value follows the files after they change, never while React
    // is working out the new list (that would update the form mid-render, and
    // a state updater can run twice): an update only marks it as needed
    const needsSync = useRef(false);
    useEffect(() => {
        if (!needsSync.current) return;
        needsSync.current = false;
        syncFormValue(items);
    }, [items, syncFormValue]);

    // Start upload for a file item
    const startUpload = useCallback(
        (item: FileItemState) => {
            const onProgress = (percent: number) => {
                setItems((prev) =>
                    prev.map((it) => (it.id === item.id ? { ...it, progress: percent } : it))
                );
            };

            if (!field.uploadPurpose) {
                // A developer error: the API won't sign an upload without knowing what it's for
                console.error(`File field "${field.name}" has no uploadPurpose`);
                setItems((prev) =>
                    prev.map((it) => (it.id === item.id ? { ...it, status: "error" as const, error: "Uploads aren't set up for this field" } : it))
                );
                return;
            }

            const { promise, cancel } = uploadFileThroughApi(item.file, field.uploadPurpose, onProgress);

            // Store cancel function on item
            setItems((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, cancelUpload: cancel } : it))
            );

            promise
                .then((uploadResult) => {
                    setItems((prev) => {
                        const updated = prev.map((it) =>
                            it.id === item.id
                                ? {
                                      ...it,
                                      status: "completed" as const,
                                      progress: 100,
                                      uploaded: uploadResult,
                                  }
                                : it
                        );
                        needsSync.current = true;
                        return updated;
                    });
                    toast.success(`Uploaded ${item.originalName}`);
                })
                .catch((err) => {
                    const message = err instanceof Error ? err.message : "Upload failed";
                    if (message === "Upload cancelled") {
                        // Handled by cancel handler
                        return;
                    }
                    setItems((prev) =>
                        prev.map((it) =>
                            it.id === item.id
                                ? { ...it, status: "error" as const, error: message }
                                : it
                        )
                    );
                    toast.error(`Failed to upload ${item.originalName}: ${message}`);
                });
        },
        [field.name, field.uploadPurpose]
    );

    // Handle file selection (drag & drop or click)
    const handleFilesSelected = (newlySelected: File[]) => {
        if (!newlySelected.length) return;

        const newErrors: Record<string, string> = {};
        const validNewFiles: File[] = [];

        newlySelected.forEach((file) => {
            const err = validateFile(file);
            const key = getFileKey(file);
            if (err) {
                newErrors[key] = err;
            } else {
                validNewFiles.push(file);
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFileErrors((prev) => ({ ...prev, ...newErrors }));
        }

        if (validNewFiles.length === 0) return;

        const userInfo = resolveUserUploadInfo(currentUser);

        const newItems: FileItemState[] = validNewFiles.map((file) => {
            const renamed = generateRenamedFileName(userInfo.username, file.name);
            const isImage = isImageFile(file);
            const previewUrl = isImage ? URL.createObjectURL(file) : null;

            return {
                id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                file,
                renamedName: renamed.fullName,
                originalName: file.name,
                size: file.size,
                status: "uploading",
                progress: 0,
                previewUrl,
            };
        });

        let combined = field.multiple
            ? [
                  ...items,
                  ...newItems.filter((ni) => !items.some((existing) => isSameFile(existing.file, ni.file))),
              ]
            : newItems;

        if (field.maxFiles) {
            combined = combined.slice(0, field.maxFiles);
        }

        setItems(combined);

        // Immediately trigger uploads for each newly added valid file
        newItems.forEach((item) => {
            startUpload(item);
        });
    };

    // User stops in-flight upload
    const handleStopUpload = (item: FileItemState) => {
        if (item.cancelUpload) {
            item.cancelUpload();
        }
        if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
        }

        setItems((prev) => {
            const updated = prev.filter((it) => it.id !== item.id);
            needsSync.current = true;
            return updated;
        });

        toast.info(`Stopped upload for ${item.originalName}`);
    };

    // User removes a file. It's only dropped from the form: an upload the
    // API never claims isn't attached to anything.
    const handleRemoveFile = (item: FileItemState) => {
        if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
        }

        const fileKey = getFileKey(item.file);
        if (fileErrors[fileKey]) {
            setFileErrors((prev) => {
                const next = { ...prev };
                delete next[fileKey];
                return next;
            });
        }

        setItems((prev) => {
            const updated = prev.filter((it) => it.id !== item.id);
            needsSync.current = true;
            return updated;
        });
    };

    const hasFileErrors = Object.keys(fileErrors).length > 0;
    const activeError = hasFileErrors
        ? "Some uploaded files have errors. Please remove the highlighted files below."
        : error;

    return (
        <div className="flex flex-col gap-3">
            <label
                htmlFor={field.name}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFilesSelected(Array.from(e.dataTransfer.files));
                    }
                }}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors duration-200 group",
                    isDragging && "border-secondary-700 bg-secondary-50/50",
                    activeError
                        ? "border-[#EF4444] bg-[#FFF5F5]"
                        : "border-[#E5E7EB] hover:border-secondary-700",
                )}
            >
                {icon}

                <div className="text-center">
                    <span
                        className={cn(
                            "text-sm font-medium font-text",
                            activeError
                                ? "text-[#EF4444]"
                                : "text-secondary-700 group-hover:underline",
                        )}
                    >
                        Click to upload
                    </span>

                    <span className="text-[#6B7280] text-sm font-text"> or drag and drop</span>
                </div>

                {field.description && (
                    <span className="text-[#9CA3AF] text-xs font-text text-center">
                        {field.description}
                    </span>
                )}

                {field.maxFiles && (
                    <span className="text-[#6B7280] text-xs font-text">
                        {items.length}/{field.maxFiles} selected
                    </span>
                )}

                <input
                    id={field.name}
                    type="file"
                    accept={
                        field.accept ?? (field.type === "image" ? IMAGE_ACCEPT : DOCUMENT_ACCEPT)
                    }
                    capture={field.capture}
                    multiple={field.multiple}
                    disabled={field.disabled}
                    className="hidden"
                    name={name}
                    ref={(e) => {
                        ref(e);
                        inputRef.current = e;
                    }}
                    onChange={(e) => {
                        const newlySelected = Array.from(e.target.files ?? []);
                        handleFilesSelected(newlySelected);
                        // Reset input so same file can be re-selected if removed
                        e.target.value = "";
                    }}
                />
            </label>

            {activeError && (
                <span className="text-[#EF4444] text-xs font-normal font-text flex items-center gap-1">
                    <AlertCircle className="size-3.5 text-[#EF4444] shrink-0" />
                    {activeError}
                </span>
            )}

            {items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((item) => {
                        const fileKey = getFileKey(item.file);
                        const fileErr = fileErrors[fileKey] || item.error;
                        const isImage = isImageFile(item.file);
                        const displayImage = item.uploaded?.url || item.previewUrl;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative rounded-lg border overflow-hidden bg-white transition-all duration-200 flex flex-col justify-between shadow-xs",
                                    fileErr
                                        ? "border-red-500 ring-2 ring-red-500 bg-[#FFF5F5]"
                                        : item.status === "uploading"
                                          ? "border-secondary-400 bg-secondary-50/20"
                                          : item.status === "completed"
                                            ? "border-emerald-300 bg-white"
                                            : "border-gray-200",
                                )}
                            >
                                {/* Media Thumbnail / Preview */}
                                {isImage && field.showPreview !== false && displayImage ? (
                                    <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                                        <Image
                                            src={displayImage}
                                            alt={item.originalName}
                                            title={item.renamedName}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                        {/* Overlay during upload */}
                                        {item.status === "uploading" && (
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-white">
                                                <Loader2 className="size-6 animate-spin mb-1 text-primary-400" />
                                                <span className="text-xs font-semibold">{item.progress}%</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-24 bg-mist-100 text-mist-600 relative">
                                        <FileText className="size-8" />
                                        <span className="text-[10px] uppercase font-mono font-bold mt-1 text-mist-500">
                                            {item.file.name.split(".").pop() || "file"}
                                        </span>
                                        {/* Overlay during upload */}
                                        {item.status === "uploading" && (
                                            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
                                                <Loader2 className="size-6 animate-spin mb-1 text-primary-300" />
                                                <span className="text-xs font-semibold">{item.progress}%</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card Details & Metadata */}
                                <div className="p-2.5 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between gap-1">
                                        <p
                                            className={cn(
                                                "text-xs font-semibold font-text truncate max-w-[85%]",
                                                fileErr ? "text-[#EF4444]" : "text-mist-900",
                                            )}
                                            title={item.renamedName}
                                        >
                                            {item.renamedName}
                                        </p>
                                        {item.status === "completed" && (
                                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                        )}
                                    </div>

                                    <p className="text-[11px] text-mist-500 truncate" title={`Original: ${item.originalName}`}>
                                        {(item.size / 1024 / 1024).toFixed(2)} MB • {item.originalName}
                                    </p>

                                    {/* Real-time Progress Bar */}
                                    {item.status === "uploading" && (
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="w-full bg-mist-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-mist-600 font-medium">
                                                <span>Uploading to Cloudinary...</span>
                                                <span>{item.progress}%</span>
                                            </div>
                                        </div>
                                    )}

                                    {fileErr && (
                                        <p className="text-[11px] text-[#EF4444] font-medium font-text mt-0.5 flex items-center gap-1">
                                            <AlertCircle className="size-3 text-[#EF4444] shrink-0" />
                                            <span className="truncate" title={fileErr}>
                                                {fileErr}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons: Cancel Upload or Remove Asset */}
                                {item.status === "uploading" ? (
                                    <button
                                        type="button"
                                        onClick={() => handleStopUpload(item)}
                                        className="absolute top-2 right-2 size-7 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                                        title="Cancel / Stop upload"
                                    >
                                        <Ban className="size-3.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(item)}
                                        className={cn(
                                            "absolute top-2 right-2 size-6 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer",
                                            fileErr
                                                ? "bg-[#EF4444] text-white hover:bg-red-700"
                                                : "bg-white text-mist-700 hover:bg-red-50 hover:text-red-600 border border-mist-200",
                                        )}
                                        title="Remove file"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
