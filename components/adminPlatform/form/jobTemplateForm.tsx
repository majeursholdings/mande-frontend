"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_DOCUMENT_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { Skeleton } from "@/components/ui/skeleton";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { mandeStockService, type JobTemplate, type MandeProduct } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// JobTemplateForm: the Job template section on a made-to-order MANDE product
// (SHOP_IMPLEMENTATION.md 5.2.1). When it sells, its order line becomes a job
// made from this: the brief, the drawings (private, staff and the job's
// manufacturers only), working days per unit, the lead and manufacturers to
// offer it to first. The pay per unit and auto-create are a super admin's,
// with the margin shown against the price. The API refuses pay at a loss and
// asks to confirm a margin under the shop's minimum ("Save anyway").
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TEMPLATE_FILES = 10;

type Values = {
    brief: string;
    productionDays: string;
    leadId: string;
    manufacturerIds: string[];
    /** Digits only (naira): the amount field's value. */
    pay: string;
    autoCreate: boolean;
    files: FileList | File[] | null;
};

type KeptFile = { publicId: string; name: string };

const keptFrom = (template: JobTemplate | null): KeptFile[] =>
    (template?.attachments ?? []).flatMap((file) => (file ? [{ publicId: file.publicId, name: file.name ?? "attachment" }] : []));

export default function JobTemplateSection({ productId }: { productId: string }) {
    const query = useQuery({ queryKey: ["shop", "mande-product", productId], queryFn: () => mandeStockService.getProduct(productId) });
    if (query.isPending) {
        return (
            <section className="flex flex-col gap-3 border-t border-border pt-5">
                <h3 className="text-base font-semibold font-text text-mist-950">Job template</h3>
                <Skeleton className="h-24 w-full bg-gray-300" />
            </section>
        );
    }
    if (query.isError) return <p className="border-t border-border pt-5 text-sm font-text text-error-600">We couldn&apos;t load the job template. Please reopen the product.</p>;
    // Remounted after each save so the form starts from what was saved
    return <JobTemplateForm key={query.data.updatedAt} product={query.data} />;
}

function JobTemplateForm({ product }: { product: MandeProduct }) {
    const queryClient = useQueryClient();
    const isSuperAdmin = useStaffPlatform().key === "super-admin";
    const { leads } = useProjectLeads();
    const { manufacturers } = useAdminManufacturers();
    const template = product.jobTemplate;
    const [kept, setKept] = useState<KeptFile[]>(keptFrom(template));
    const [isSaving, setIsSaving] = useState(false);
    const [lowMargin, setLowMargin] = useState<string | null>(null);

    const methods = useForm<Values>({
        mode: "onTouched",
        defaultValues: {
            brief: template?.brief ?? "",
            productionDays: template ? String(template.productionDays) : "",
            leadId: template?.leadId ?? "",
            manufacturerIds: template?.manufacturerIds ?? [],
            pay: template?.payKobo ? String(template.payKobo / 100) : "",
            autoCreate: template?.autoCreate ?? false,
            files: null,
        },
    });
    const pay = Number(useWatch({ control: methods.control, name: "pay" }) || 0);
    const margin = pay > 0 ? fromKobo(product.priceKobo) - pay : null;
    const marginPercent = margin !== null ? Math.floor((margin / fromKobo(product.priceKobo)) * 100) : null;

    if (product.stock !== null) return null;

    const fields: FormFieldConfig[] = [
        {
            name: "brief",
            type: "textarea",
            label: "Brief",
            placeholder: "What to make: the spec, materials and finish",
            description: "Becomes the job's description. Staff and the job's manufacturers see it, never customers.",
            height: 110,
            validation: { required: "Describe what to make", minLength: { value: 10, message: "Use at least 10 characters" }, maxLength: { value: 2000, message: "Keep it under 2,000 characters" } },
        },
        {
            name: "productionDays",
            type: "number",
            label: "Working days to make one",
            description: "Sets each job's due date, and the product's lead time (plus the shop's buffer).",
            min: 1,
            max: 180,
            validation: { required: "Say how long one takes", min: { value: 1, message: "At least 1 day" }, max: { value: 180, message: "At most 180 days" } },
        },
        {
            name: "leadId",
            type: "select",
            label: "Project lead (optional)",
            placeholder: "Picked when the job is made",
            options: leads.map((lead: { id: string; name: string }) => ({ label: lead.name, value: lead.id })),
            clearable: true,
        },
        {
            name: "manufacturerIds",
            type: "multiselect",
            label: "Offer to first (optional)",
            placeholder: "Open to applications",
            options: manufacturers.map((manufacturer) => ({ label: manufacturer.companyName, value: manufacturer.id })),
            maxSelections: 5,
        },
        ...(isSuperAdmin
            ? ([
                  {
                      name: "pay",
                      type: "amount",
                      label: "Pay per unit",
                      placeholder: "₦0",
                      description:
                          margin !== null
                              ? `Margin: ${formatPrice(margin)} a unit (${marginPercent}% of the ${formatPrice(fromKobo(product.priceKobo))} price)`
                              : "What the manufacturer is paid for one. A line of 3 makes a job paying 3 times this.",
                  },
                  {
                      name: "autoCreate",
                      type: "checkbox",
                      label: "Make the job as soon as an order is paid (needs the pay and a lead)",
                  },
              ] satisfies FormFieldConfig[])
            : []),
        {
            name: "files",
            type: "file",
            label: "Drawings and references (optional)",
            description: `PDFs, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each. Copied onto each job.`,
            accept: API_DOCUMENT_ACCEPT,
            multiple: true,
            maxFiles: Math.max(0, MAX_TEMPLATE_FILES - kept.length),
            disabled: kept.length >= MAX_TEMPLATE_FILES,
            uploadPurpose: "job-attachment",
        },
    ];

    const save = async (values: Values, confirmLowMargin = false) => {
        setIsSaving(true);
        try {
            const uploads = Array.from((values.files as Array<{ name?: string; originalName?: string; publicId?: string }>) ?? []).map((file) => {
                if (!file?.publicId) throw new Error("Some files are still uploading. Wait for them to finish, then try again.");
                return { publicId: file.publicId, name: file.originalName || file.name || "attachment" };
            });
            await mandeStockService.setJobTemplate(product.id, {
                brief: values.brief.trim(),
                productionDays: Number(values.productionDays),
                leadId: values.leadId || null,
                manufacturerIds: values.manufacturerIds,
                attachments: [...kept, ...uploads],
                ...(isSuperAdmin ? { payKobo: values.pay ? Math.round(Number(values.pay) * 100) : null, autoCreate: values.autoCreate } : {}),
                confirmLowMargin,
            });
            clearFormUploadedFiles("files");
            setLowMargin(null);
            await queryClient.invalidateQueries({ queryKey: ["shop", "mande-product", product.id] });
            toast.success("Job template saved");
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "LOW_JOB_MARGIN") {
                setLowMargin(error.message);
            } else {
                await cleanupFormFieldUploads("files");
                toast.error(getErrorMessage(error, "Couldn't save the job template. Please try again."));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const remove = async () => {
        setIsSaving(true);
        try {
            await mandeStockService.removeJobTemplate(product.id);
            await queryClient.invalidateQueries({ queryKey: ["shop", "mande-product", product.id] });
            toast.success("Job template removed");
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't remove the job template. Please try again."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold font-text text-mist-950">Job template</h3>
                <p className="text-sm font-text text-mist-500">
                    {template
                        ? "When this sells, its order line becomes a job made from this."
                        : "Add one to have this product made through a job when it sells."}
                    {product.sourceJob ? ` Made from job ${product.sourceJob.code}.` : ""}
                </p>
                {!isSuperAdmin && template && <p className="text-xs font-text text-mist-500">Pay per unit: {template.payKobo ? formatPrice(fromKobo(template.payKobo)) : "not set yet (a super admin sets it)"}</p>}
            </div>
            {kept.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {kept.map((file) => (
                        <li key={file.publicId} className="flex items-center gap-2 text-sm font-text text-mist-800">
                            <FileText className="size-4 text-mist-400" aria-hidden />
                            <span className="flex-1 truncate">{file.name}</span>
                            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setKept((current) => current.filter((each) => each.publicId !== file.publicId))} className="cursor-pointer text-mist-500 hover:text-error-600">
                                <Trash2 className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <MainForm<Values>
                methods={methods}
                fields={fields}
                onSubmit={(values) => save(values)}
                renderFooter={({ canSubmit }) => (
                    <div className="flex flex-col gap-3 pt-1">
                        {lowMargin && (
                            <p className="rounded-lg border border-warning-200 bg-warning-50 px-3.5 py-3 text-sm font-text text-mist-900">
                                {lowMargin}{" "}
                                <button type="button" disabled={isSaving} onClick={() => save(methods.getValues(), true)} className="font-semibold text-primary-700 underline-offset-2 hover:underline cursor-pointer">
                                    Save anyway
                                </button>
                            </p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                            {template ? (
                                <button type="button" disabled={isSaving} onClick={remove} className="text-sm font-medium font-text text-error-600 hover:underline cursor-pointer disabled:opacity-50">
                                    Remove template
                                </button>
                            ) : (
                                <span />
                            )}
                            <FormSubmitButton label={template ? "Save template" : "Add template"} loadingLabel="Saving..." isLoading={isSaving} disabled={!canSubmit} className="w-auto px-6" />
                        </div>
                    </div>
                )}
            />
        </section>
    );
}
