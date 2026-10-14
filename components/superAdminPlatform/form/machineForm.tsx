"use client";

import { useState, type KeyboardEvent } from "react";
import { Controller, useForm, useFormContext, useFormState, type Control } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, XIcon } from "lucide-react";
import MainForm, { ErrorIcon, FormField, inputClass } from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { getErrorMessage } from "@/lib/api";
import { MAX_AMOUNT, MAX_AMOUNT_LABEL } from "@/lib/number";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import {
    MACHINE_LIMITS,
    machineService,
    type CreateMachinePayload,
    type Machine,
    type MachineImage,
    type UpdateMachinePayload,
} from "@/lib/services/machineService";

type MachineValues = {
    /** From the image field: the saved photo, a new upload, or null once removed. */
    machineImage: MachineImage | null;
    machineName: string;
    machineModel: string;
    machineType: string;
    machineCategory: string;
    machineFunctions: string[];
    machineHourlyPrice: string;
    machineDailyPrice: string;
    machineDescription: string;
    machineSortOrder: string;
    machineActive: boolean;
};

const LABEL_CLASS = "text-[#1F2937] text-sm font-medium font-text";
const HINT_CLASS = "text-[#9CA3AF] text-xs font-normal font-text";
const MAX_SUGGESTIONS = 8;
const SORT_ORDER_LIMIT = 1_000_000;

function toValues(machine?: Machine): MachineValues {
    return {
        machineImage: machine?.image ?? null,
        machineName: machine?.name ?? "",
        machineModel: machine?.model ?? "",
        machineType: machine?.type ?? "",
        machineCategory: machine?.category ?? "",
        machineFunctions: machine?.functions ?? [],
        // Prices are entered in naira and kept in kobo
        machineHourlyPrice: machine?.hourlyPriceKobo != null ? String(Math.round(machine.hourlyPriceKobo / 100)) : "",
        machineDailyPrice: machine?.dailyPriceKobo != null ? String(Math.round(machine.dailyPriceKobo / 100)) : "",
        machineDescription: machine?.description ?? "",
        machineSortOrder: String(machine?.sortOrder ?? 0),
        machineActive: machine?.active ?? true,
    };
}

const toKobo = (naira: string) => (naira.trim() ? Math.round(Number(naira) * 100) : null);
const orNull = (value: string) => value.trim() || null;

function toPayload(values: MachineValues): CreateMachinePayload {
    const image = values.machineImage;
    return {
        name: values.machineName.trim(),
        image: image ? { publicId: image.publicId } : null,
        hourlyPriceKobo: toKobo(values.machineHourlyPrice),
        dailyPriceKobo: toKobo(values.machineDailyPrice),
        functions: values.machineFunctions,
        category: values.machineCategory.trim(),
        model: orNull(values.machineModel),
        type: orNull(values.machineType),
        description: orNull(values.machineDescription),
        sortOrder: Number(values.machineSortOrder) || 0,
        active: values.machineActive,
    };
}

/** The fields MainForm lays out: the photo (the saved one shows in it), then name, model and type. */
const MAIN_FIELDS: FormFieldConfig[] = [
    {
        name: "machineImage",
        type: "image",
        label: "Image (optional)",
        description: `JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB. A new one replaces the current image.`,
        accept: API_PHOTO_ACCEPT,
        maxFiles: 1,
        uploadPurpose: "machine-image",
    },
    {
        name: "machineName",
        type: "text",
        label: "Name",
        placeholder: "e.g. Sliding panel saw",
        maxLength: MACHINE_LIMITS.nameMax,
        autoComplete: "off",
        validation: {
            required: "Enter a name",
            validate: (value: string) => {
                const length = value.trim().length;
                return (length >= 2 && length <= MACHINE_LIMITS.nameMax) || `Use 2 to ${MACHINE_LIMITS.nameMax} characters`;
            },
        },
    },
    {
        name: "machineModel",
        type: "text",
        label: "Model (optional)",
        placeholder: "e.g. Felder K 940",
        maxLength: MACHINE_LIMITS.modelMax,
        autoComplete: "off",
    },
    {
        name: "machineType",
        type: "text",
        label: "Type (optional)",
        placeholder: "e.g. CNC, Manual",
        maxLength: MACHINE_LIMITS.typeMax,
        autoComplete: "off",
    },
];

/** "Enter at least ₦1" (and at most MAX_AMOUNT) for a filled-in price, and at least one of the two prices. */
const validatePrice = (value: string, values: Record<string, unknown>) => {
    const hourly = String(values.machineHourlyPrice ?? "").trim();
    const daily = String(values.machineDailyPrice ?? "").trim();
    if (!hourly && !daily) return "Enter a price per hour, per day or both";
    if (value.trim() && Number(value) < MACHINE_LIMITS.priceMinKobo / 100) return "Enter at least ₦1";
    if (value.trim() && Number(value) > MAX_AMOUNT) return `Enter at most ${MAX_AMOUNT_LABEL}`;
    return true;
};

const EXTRA_FIELDS: Record<string, FormFieldConfig> = {
    machineHourlyPrice: {
        name: "machineHourlyPrice",
        type: "amount",
        label: "Price per hour",
        placeholder: "Not offered",
        description: "Leave empty if it isn't booked by the hour.",
        // "At least one price" depends on both, so a change here checks the other again
        validation: { validate: validatePrice, deps: "machineDailyPrice" },
    },
    machineDailyPrice: {
        name: "machineDailyPrice",
        type: "amount",
        label: "Price per day",
        placeholder: "Not offered",
        description: "Leave empty if it isn't booked by the day.",
        validation: { validate: validatePrice, deps: "machineHourlyPrice" },
    },
    machineDescription: {
        name: "machineDescription",
        type: "textarea",
        label: "Description (optional)",
        placeholder: "e.g. Cuts full sheets to size with a scoring blade for clean edges.",
        height: 90,
        description: "Shown to makers on the booking form.",
        validation: {
            maxLength: { value: MACHINE_LIMITS.descriptionMax, message: `Keep it to ${MACHINE_LIMITS.descriptionMax} characters` },
        },
    },
    machineSortOrder: {
        name: "machineSortOrder",
        type: "number",
        label: "Sort order",
        description: "Lower numbers show first on the booking form.",
        step: 1,
        validation: {
            validate: (value: string) =>
                (value.trim() !== "" && Number.isInteger(Number(value)) && Math.abs(Number(value)) <= SORT_ORDER_LIMIT) ||
                `Enter a whole number from -${SORT_ORDER_LIMIT.toLocaleString("en-GB")} to ${SORT_ORDER_LIMIT.toLocaleString("en-GB")}`,
        },
    },
    machineActive: {
        name: "machineActive",
        type: "checkbox",
        label: "Active: makers can book it (when it has a price for the booking unit)",
    },
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <span className="flex items-center gap-1 text-xs font-normal font-text text-error-500">
            <ErrorIcon />
            {message}
        </span>
    );
}

/** Free text, with the categories already in use offered as suggestions. */
function CategoryField() {
    const { control } = useFormContext<MachineValues>();
    const categoriesQuery = useQuery({
        queryKey: queryKeys.machines.categories(),
        queryFn: () => machineService.getCategories(),
        staleTime: 60_000,
    });

    return (
        <Controller
            name="machineCategory"
            control={control}
            rules={{
                validate: (value: string) => {
                    const length = value.trim().length;
                    if (length === 0) return "Enter a category";
                    return (length >= 2 && length <= MACHINE_LIMITS.categoryMax) || `Use 2 to ${MACHINE_LIMITS.categoryMax} characters`;
                },
            }}
            render={({ field, fieldState }) => {
                const typed = (field.value ?? "").trim().toLowerCase();
                const suggestions = (categoriesQuery.data ?? [])
                    .filter((category) => category.toLowerCase() !== typed && category.toLowerCase().includes(typed))
                    .slice(0, MAX_SUGGESTIONS);
                return (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="machineCategory" className={LABEL_CLASS}>
                            Category
                        </label>
                        <Input
                            id="machineCategory"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="e.g. Cutting"
                            maxLength={MACHINE_LIMITS.categoryMax}
                            autoComplete="off"
                            aria-invalid={!!fieldState.error}
                            className={inputClass(fieldState.error?.message)}
                        />
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5" aria-label="Categories in use">
                                <span className={HINT_CLASS}>In use:</span>
                                {suggestions.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => field.onChange(category)}
                                        className="rounded-full bg-mist-100 px-2.5 py-1 text-xs font-medium font-text text-mist-800 hover:bg-mist-200 cursor-pointer"
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        )}
                        {fieldState.error ? (
                            <FieldError message={fieldState.error.message} />
                        ) : (
                            <span className={HINT_CLASS}>Shown to makers on the booking form, e.g. Cutting or Finishing.</span>
                        )}
                    </div>
                );
            }}
        />
    );
}

/** What the machine does: 1 to 10 short entries, added and removed one by one. */
function FunctionsField() {
    const { control } = useFormContext<MachineValues>();
    const [draft, setDraft] = useState("");
    const [draftError, setDraftError] = useState<string | null>(null);

    return (
        <Controller
            name="machineFunctions"
            control={control}
            rules={{ validate: (value: string[]) => value.length > 0 || "Add at least one function" }}
            render={({ field, fieldState }) => {
                const functions = field.value ?? [];
                const isFull = functions.length >= MACHINE_LIMITS.functionsMax;
                const add = () => {
                    const value = draft.trim().replace(/\s+/g, " ");
                    if (!value) return;
                    if (value.length < MACHINE_LIMITS.functionMin || value.length > MACHINE_LIMITS.functionMax) {
                        setDraftError(`Use ${MACHINE_LIMITS.functionMin} to ${MACHINE_LIMITS.functionMax} characters`);
                        return;
                    }
                    if (functions.some((item) => item.toLowerCase() === value.toLowerCase())) {
                        setDraftError("That function is already on the list");
                        return;
                    }
                    field.onChange([...functions, value]);
                    setDraft("");
                    setDraftError(null);
                };
                const remove = (index: number) => {
                    field.onChange(functions.filter((_, i) => i !== index));
                    field.onBlur();
                };
                const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
                    // Enter adds the function instead of sending the form
                    if (event.key === "Enter") {
                        event.preventDefault();
                        add();
                    }
                };
                const error = draftError ?? fieldState.error?.message;
                return (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="machineFunctionDraft" className={LABEL_CLASS}>
                            Functions
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="machineFunctionDraft"
                                value={draft}
                                onChange={(event) => {
                                    setDraft(event.target.value);
                                    if (draftError) setDraftError(null);
                                }}
                                onKeyDown={onKeyDown}
                                placeholder={isFull ? "That's the most there can be" : "e.g. Panel cutting"}
                                maxLength={MACHINE_LIMITS.functionMax}
                                disabled={isFull}
                                autoComplete="off"
                                className={cn(inputClass(error), "flex-1")}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={add}
                                disabled={isFull || !draft.trim()}
                                className="h-11 gap-1.5 rounded-lg border-gray-200 px-3 text-sm font-medium font-text text-mist-950 cursor-pointer"
                            >
                                <Plus className="size-4" />
                                Add
                            </Button>
                        </div>
                        {functions.length > 0 && (
                            <ul className="flex flex-wrap gap-2" aria-label="Functions added">
                                {functions.map((item, index) => (
                                    <li
                                        key={item}
                                        className="inline-flex items-center gap-1 rounded-full bg-mist-100 py-1 pr-1 pl-3 text-sm font-text text-mist-950"
                                    >
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            aria-label={`Remove ${item}`}
                                            className="flex size-6 items-center justify-center rounded-full text-mist-500 hover:bg-mist-200 hover:text-mist-950 cursor-pointer"
                                        >
                                            <XIcon className="size-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {error ? (
                            <FieldError message={error} />
                        ) : (
                            <span className={HINT_CLASS}>
                                What it does, 1 to {MACHINE_LIMITS.functionsMax}. Press Enter or Add after each one.
                                {functions.length > 0 ? ` ${functions.length} of ${MACHINE_LIMITS.functionsMax} added.` : ""}
                            </span>
                        )}
                    </div>
                );
            }}
        />
    );
}

/** Category, functions, prices, description, sort order and active, under name, model and type. */
function MachineExtraFields() {
    const { register, control, getValues, setValue, formState } = useFormContext<MachineValues>();
    const { errors } = formState;

    const renderField = (name: keyof MachineValues) => (
        <FormField<MachineValues>
            field={EXTRA_FIELDS[name]}
            register={register}
            control={control}
            getValues={getValues}
            setValue={setValue}
            errors={errors}
            hideRequiredMark
        />
    );

    return (
        <div className="flex flex-col gap-4">
            <CategoryField />
            <FunctionsField />
            <div className="flex flex-col gap-4 md:flex-row">
                {renderField("machineHourlyPrice")}
                {renderField("machineDailyPrice")}
            </div>
            {renderField("machineDescription")}
            {renderField("machineSortOrder")}
            {renderField("machineActive")}
        </div>
    );
}

/**
 * Creating or editing a machine: its photo, name, model, type, category
 * (with the ones in use suggested), what it does, a price per hour and/or
 * per day (naira here, kobo on the API), a description, where it sorts and
 * whether it's active. Edit sends only what changed.
 */
export default function MachineForm({
    machine,
    onCreate,
    onUpdate,
    onCancel,
}: {
    /** Set to edit it; left out to create one. */
    machine?: Machine;
    onCreate?: (payload: CreateMachinePayload) => Promise<void>;
    onUpdate?: (payload: UpdateMachinePayload) => Promise<void>;
    onCancel: () => void;
}) {
    const isEdit = !!machine;
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<MachineValues>({ mode: "onTouched", defaultValues: toValues(machine) });

    const handleSubmit = async (values: MachineValues) => {
        setIsLoading(true);
        try {
            const payload = toPayload(values);
            if (isEdit) {
                const changes: UpdateMachinePayload = { ...payload };
                // The photo is only sent when it changed (null removes it)
                if (values.machineImage?.publicId === machine.image?.publicId) delete changes.image;
                await onUpdate?.(changes);
            } else {
                await onCreate?.(payload);
            }
        } catch (err) {
            toast.error(
                getErrorMessage(err, isEdit ? "Couldn't save the machine. Please try again." : "Couldn't add the machine. Please try again."),
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <MainForm<MachineValues>
                methods={methods}
                fields={MAIN_FIELDS}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                rowPairs={[["machineModel", "machineType"]]}
                hideRequiredMarks
                footerSlot={<MachineExtraFields />}
                renderFooter={({ isLoading, canSubmit }) => (
                    <FormActions
                        control={methods.control}
                        isEdit={isEdit}
                        isLoading={isLoading}
                        canSubmit={canSubmit}
                        onCancel={onCancel}
                    />
                )}
            />
        </div>
    );
}

/** Cancel and save. Reads isDirty here, so a change to it re-renders only these buttons. */
function FormActions({
    control,
    isEdit,
    isLoading,
    canSubmit,
    onCancel,
}: {
    control: Control<MachineValues>;
    isEdit: boolean;
    isLoading: boolean;
    canSubmit: boolean;
    onCancel: () => void;
}) {
    const { isDirty } = useFormState({ control });
    return (
        <div className="flex justify-end gap-3">
            <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
            >
                Cancel
            </Button>
            <FormSubmitButton
                label={isEdit ? "Save machine" : "Add machine"}
                loadingLabel={isEdit ? "Saving..." : "Adding..."}
                isLoading={isLoading}
                disabled={!canSubmit || (isEdit && !isDirty)}
                className="w-auto px-5"
            />
        </div>
    );
}
