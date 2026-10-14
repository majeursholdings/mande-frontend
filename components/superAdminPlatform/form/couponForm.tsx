"use client";

import { useEffect, useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm, { FormField } from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { getErrorMessage } from "@/lib/api";
import { getLagosNow } from "@/lib/machineBookingSchedule";
import { MandeApiError } from "@/lib/types/api";
import type {
    Coupon,
    CouponAppliesTo,
    CouponType,
    CreateCouponPayload,
    UpdateCouponPayload,
} from "@/lib/services/couponService";

type CouponValues = {
    code: string;
    description: string;
    type: CouponType;
    value: string;
    appliesTo: CouponAppliesTo;
    startsAt: string;
    expiresAt: string;
    maxUses: string;
    maxUsesPerCustomer: string;
    active: boolean;
};

const CODE_PATTERN = /^[A-Z0-9-]{3,30}$/;
const DESCRIPTION_MAX_LENGTH = 200;
const MAX_USES_LIMIT = 1_000_000;

export const COUPON_APPLIES_TO_LABELS: Record<CouponAppliesTo, string> = {
    bookings: "Machine bookings",
    subscriptions: "Subscriptions",
    both: "Bookings and subscriptions",
};

const TYPE_OPTIONS = [
    { label: "Percent off", value: "percent" },
    { label: "Fixed amount off", value: "fixed" },
];

const APPLIES_TO_OPTIONS = (Object.keys(COUPON_APPLIES_TO_LABELS) as CouponAppliesTo[]).map((value) => ({
    label: COUPON_APPLIES_TO_LABELS[value],
    value,
}));

// ─── Dates: picked as days, kept on the API as Lagos start/end of day ─────────

const pad = (value: number) => String(value).padStart(2, "0");

/** The date field's value (a local midnight ISO) to "YYYY-MM-DD". */
function fieldToDateKey(value: string): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** An ISO time from the API to the date field's value, by its Lagos day. */
function isoToField(iso: string | null): string {
    if (!iso) return "";
    const [year, month, day] = getLagosNow(new Date(iso)).dateKey.split("-").map(Number);
    return new Date(year, month - 1, day).toISOString();
}

/** The start of a Lagos day, or its last moment. */
const dateKeyToIso = (key: string, edge: "start" | "end") =>
    new Date(`${key}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}+01:00`).toISOString();

const isWholeNumberIn = (value: string, min: number, max: number) =>
    Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

function toValues(coupon?: Coupon): CouponValues {
    if (!coupon) {
        return {
            code: "",
            description: "",
            type: "percent",
            value: "",
            appliesTo: "both",
            startsAt: "",
            expiresAt: "",
            maxUses: "",
            maxUsesPerCustomer: "",
            active: true,
        };
    }
    return {
        code: coupon.code,
        description: coupon.description ?? "",
        type: coupon.type,
        value: coupon.type === "fixed" ? String(Math.round(coupon.value / 100)) : String(coupon.value),
        appliesTo: coupon.appliesTo,
        startsAt: isoToField(coupon.startsAt),
        expiresAt: isoToField(coupon.expiresAt),
        maxUses: coupon.maxUses === null ? "" : String(coupon.maxUses),
        maxUsesPerCustomer: coupon.maxUsesPerCustomer === null ? "" : String(coupon.maxUsesPerCustomer),
        active: coupon.active,
    };
}

function toPayload(values: CouponValues): Omit<CreateCouponPayload, "code"> {
    const startKey = fieldToDateKey(values.startsAt);
    const endKey = fieldToDateKey(values.expiresAt);
    const description = values.description.trim();
    return {
        description: description || null,
        type: values.type,
        // Fixed amounts are entered in naira and kept in kobo
        value: values.type === "fixed" ? Math.round(Number(values.value) * 100) : Number(values.value),
        appliesTo: values.appliesTo,
        startsAt: startKey ? dateKeyToIso(startKey, "start") : null,
        expiresAt: endKey ? dateKeyToIso(endKey, "end") : null,
        maxUses: values.maxUses.trim() ? Number(values.maxUses) : null,
        maxUsesPerCustomer: values.maxUsesPerCustomer.trim() ? Number(values.maxUsesPerCustomer) : null,
        active: values.active,
    };
}

function getMainFields(type: CouponType, isEdit: boolean): FormFieldConfig[] {
    return [
        {
            name: "code",
            type: "text",
            label: "Code",
            placeholder: "e.g. WELCOME10",
            maxLength: 30,
            autoComplete: "off",
            readOnly: isEdit,
            description: isEdit
                ? "A code can't be changed once it's created."
                : "What customers type in. 3 to 30 letters, numbers or hyphens. It can't be changed later.",
            validation: isEdit
                ? undefined
                : {
                      required: "Enter a code",
                      validate: (value: string) =>
                          CODE_PATTERN.test(value.trim().toUpperCase()) || "Use 3 to 30 letters, numbers or hyphens",
                  },
        },
        {
            name: "description",
            type: "textarea",
            label: "Description (optional)",
            placeholder: "e.g. For the October maker meetup",
            height: 80,
            description: "An internal note. Customers don't see it.",
            validation: {
                maxLength: { value: DESCRIPTION_MAX_LENGTH, message: `Keep it under ${DESCRIPTION_MAX_LENGTH} characters` },
            },
        },
        {
            name: "type",
            type: "select",
            label: "Discount type",
            options: TYPE_OPTIONS,
            validation: { required: "Pick a discount type" },
        },
        type === "fixed"
            ? {
                  name: "value",
                  type: "amount",
                  label: "Amount off",
                  placeholder: "₦0",
                  validation: {
                      required: "Enter an amount",
                      validate: (value: string) => Number(value) >= 1 || "Enter at least ₦1",
                  },
              }
            : {
                  name: "value",
                  type: "number",
                  label: "Percent off",
                  placeholder: "10",
                  min: 1,
                  max: 100,
                  validation: {
                      required: "Enter a percent",
                      validate: (value: string) => isWholeNumberIn(value, 1, 100) || "Enter a whole number from 1 to 100",
                  },
              },
        {
            name: "appliesTo",
            type: "select",
            label: "Applies to",
            options: APPLIES_TO_OPTIONS,
            validation: { required: "Pick what it can be used on" },
        },
    ];
}

/** The dates, limits and active switch, under the main fields. */
function CouponExtraFields({ usedCount }: { usedCount: number }) {
    const methods = useFormContext<CouponValues>();
    const { register, control, getValues, setValue } = methods;
    const { errors } = methods.formState;
    const [startsAt, expiresAt] = useWatch({ control, name: ["startsAt", "expiresAt"] });
    const startKey = fieldToDateKey(startsAt ?? "");
    const today = getLagosNow().dateKey;

    const fields: Record<string, FormFieldConfig> = {
        startsAt: {
            name: "startsAt",
            type: "date",
            label: "Starts (optional)",
            placeholder: "Straight away",
        },
        expiresAt: {
            name: "expiresAt",
            type: "date",
            label: "Ends (optional)",
            placeholder: "No end date",
            isDateDisabled: (date: Date) => {
                const key = fieldToDateKey(date.toISOString());
                return key < today || (!!startKey && key < startKey);
            },
            validation: {
                validate: (value: string, values: Record<string, unknown>) => {
                    const end = fieldToDateKey(value);
                    const start = fieldToDateKey(String(values.startsAt ?? ""));
                    return !end || !start || end >= start || "The end date can't be before the start date";
                },
            },
        },
        maxUses: {
            name: "maxUses",
            type: "number",
            label: "Total uses (optional)",
            placeholder: "No limit",
            description: usedCount > 0 ? `Used ${usedCount} time${usedCount === 1 ? "" : "s"} so far.` : "Leave empty for no limit.",
            min: 1,
            validation: {
                validate: (value: string) => {
                    if (!value.trim()) return true;
                    if (!isWholeNumberIn(value, 1, MAX_USES_LIMIT)) return "Enter a whole number of 1 or more";
                    return Number(value) >= usedCount || `It's been used ${usedCount} times already`;
                },
            },
        },
        maxUsesPerCustomer: {
            name: "maxUsesPerCustomer",
            type: "number",
            label: "Uses per customer (optional)",
            placeholder: "No limit",
            description: "Counted by email address.",
            min: 1,
            validation: {
                validate: (value: string) =>
                    !value.trim() || isWholeNumberIn(value, 1, MAX_USES_LIMIT) || "Enter a whole number of 1 or more",
            },
        },
        active: {
            name: "active",
            type: "checkbox",
            label: "Active: customers can use it (within its dates)",
        },
    };

    const renderField = (name: keyof CouponValues) => (
        <FormField<CouponValues>
            field={fields[name]}
            register={register}
            control={control}
            getValues={getValues}
            setValue={setValue}
            errors={errors}
            hideRequiredMark
        />
    );

    /** A date field with a "Clear" link once it has a value (both dates are optional). */
    const renderDate = (name: "startsAt" | "expiresAt", value: string | undefined) => (
        <div className="flex flex-1 flex-col gap-1">
            {renderField(name)}
            {value && (
                <button
                    type="button"
                    onClick={() => setValue(name, "", { shouldDirty: true, shouldValidate: true })}
                    className="self-start text-xs font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                >
                    Clear date
                </button>
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
                {renderDate("startsAt", startsAt)}
                {renderDate("expiresAt", expiresAt)}
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
                {renderField("maxUses")}
                {renderField("maxUsesPerCustomer")}
            </div>
            {renderField("active")}
        </div>
    );
}

/**
 * Creating or editing a coupon: its code (fixed once created), an internal
 * note, percent or fixed amount off (naira here, kobo on the API), what it
 * can be used on, optional dates and limits, and whether it's active.
 * Edit sends every field except the code.
 */
export default function CouponForm({
    coupon,
    onCreate,
    onUpdate,
    onCancel,
}: {
    /** Set to edit it; left out to create one. */
    coupon?: Coupon;
    onCreate?: (payload: CreateCouponPayload) => Promise<void>;
    onUpdate?: (payload: UpdateCouponPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const isEdit = !!coupon;
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<CouponValues>({ mode: "onTouched", defaultValues: toValues(coupon) });
    const type = useWatch({ control: methods.control, name: "type" }) ?? "percent";
    const code = useWatch({ control: methods.control, name: "code" }) ?? "";
    const { isDirty } = methods.formState;

    // Codes are uppercase: what's typed is shown (and kept) that way
    useEffect(() => {
        if (!isEdit && code !== code.toUpperCase()) {
            methods.setValue("code", code.toUpperCase(), { shouldDirty: true });
        }
    }, [code, isEdit, methods]);

    // A value entered for the other type rarely makes sense: check it again
    useEffect(() => {
        if (methods.getFieldState("value").isTouched) void methods.trigger("value");
    }, [type, methods]);

    const handleSubmit = async (values: CouponValues) => {
        setIsLoading(true);
        try {
            const payload = toPayload(values);
            if (isEdit) {
                await onUpdate?.(payload);
            } else {
                await onCreate?.({ ...payload, code: values.code.trim().toUpperCase() });
            }
        } catch (err) {
            if (err instanceof MandeApiError && err.code === "COUPON_CODE_TAKEN") {
                methods.setError("code", { message: "That code is already taken. Try another." });
                toast.error("That code is already taken. Try another.");
            } else {
                toast.error(
                    getErrorMessage(err, isEdit ? "Couldn't save the coupon. Please try again." : "Couldn't create the coupon. Please try again."),
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<CouponValues>
            methods={methods}
            fields={getMainFields(type, isEdit)}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rowPairs={[["type", "value"]]}
            hideRequiredMarks
            footerSlot={<CouponExtraFields usedCount={coupon?.usedCount ?? 0} />}
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
                    <FormSubmitButton
                        label={isEdit ? "Save coupon" : "Create coupon"}
                        loadingLabel={isEdit ? "Saving..." : "Creating..."}
                        isLoading={isLoading}
                        disabled={!canSubmit || (isEdit && !isDirty)}
                        className="w-auto px-5"
                    />
                </div>
            )}
        />
    );
}
