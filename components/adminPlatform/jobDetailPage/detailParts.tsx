"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, ImageIcon, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { getAdminManufacturer, type AdminJobAttachment } from "@/constant/admin";

/** A titled block in the job panel, with an optional count and action on the right. */
export function DetailSection({
    title,
    count,
    action,
    children,
    className,
}: {
    title: string;
    count?: number;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-medium font-text text-mist-950">
                    {title}
                    {count !== undefined && <span className="text-mist-400"> ({count})</span>}
                </h3>
                {action}
            </div>
            {children}
        </section>
    );
}

// Browsers can't draw HEIC — those show an icon tile instead of a broken image
const canPreview = (name: string) => !/\.(heic|heif)$/i.test(name);

/**
 * Images shown inline, so they can be seen without opening anything — each
 * opens full size in a new tab.
 */
export function ImagePreviewGrid({
    images,
    className,
}: {
    images: { url: string; name: string }[];
    className?: string;
}) {
    return (
        <ul className={cn("grid grid-cols-2 gap-3", className)}>
            {images.map((image, index) => (
                <li key={`${image.url}-${index}`}>
                    <Link
                        href={image.url}
                        target="_blank"
                        title={`${image.name} — open full size`}
                        className="group block overflow-hidden rounded-lg border border-border bg-mist-50"
                    >
                        <span className="relative block aspect-4/3">
                            {canPreview(image.name) ? (
                                <Image
                                    src={image.url}
                                    alt={image.name}
                                    fill
                                    // Cloudinary links (signed ones expire) are shown as they are
                                    unoptimized
                                    sizes="220px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-mist-400">
                                    <ImageIcon className="size-7" strokeWidth={1.5} aria-hidden />
                                </span>
                            )}
                        </span>
                        <span className="block truncate px-2.5 py-1.5 text-xs font-text text-mist-600">
                            {image.name}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** Documents as chips that open in a new tab. */
export function DocumentChips({ documents }: { documents: AdminJobAttachment[] }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((document) => (
                <Link
                    key={document.url}
                    href={document.url}
                    target="_blank"
                    title={document.name}
                    className="flex min-w-0 items-center gap-2 rounded-md bg-indigo-50 px-3 py-2.5 text-sm font-text text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                    <FileText className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{document.name}</span>
                </Link>
            ))}
        </div>
    );
}

/** A job's attachments — documents as chips, images as previews. */
export function AttachmentList({ attachments }: { attachments: AdminJobAttachment[] }) {
    const documents = attachments.filter((attachment) => attachment.kind === "document");
    const images = attachments.filter((attachment) => attachment.kind === "image");

    return (
        <div className="flex flex-col gap-3">
            {documents.length > 0 && <DocumentChips documents={documents} />}
            {images.length > 0 && <ImagePreviewGrid images={images} />}
        </div>
    );
}

/** Each manufacturer on the job, with call and email links. */
export function ContactManufacturerDialog({
    manufacturerIds,
    open,
    onOpenChange,
}: {
    manufacturerIds: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const manufacturers = manufacturerIds.map(getAdminManufacturer).filter((manufacturer) => !!manufacturer);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-100">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Contact manufacturer</DialogTitle>
                    <DialogDescription>Call or email them about this job.</DialogDescription>
                </div>
                <ul className="flex flex-col gap-3">
                    {manufacturers.map((manufacturer) => (
                        <li key={manufacturer.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                            <div>
                                <p className="text-sm font-medium font-text text-mist-950">{manufacturer.companyName}</p>
                                <p className="text-xs font-text text-mist-500">{manufacturer.contactName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href={`tel:${manufacturer.phone}`}
                                    className="flex items-center justify-center gap-2 rounded-button border border-border py-2 text-sm font-medium font-text text-mist-900 transition-colors hover:bg-mist-50"
                                >
                                    <Phone className="size-4" aria-hidden />
                                    Call
                                </a>
                                <a
                                    href={`mailto:${manufacturer.email}`}
                                    className="flex items-center justify-center gap-2 rounded-button border border-border py-2 text-sm font-medium font-text text-mist-900 transition-colors hover:bg-mist-50"
                                >
                                    <Mail className="size-4" aria-hidden />
                                    Email
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    );
}
