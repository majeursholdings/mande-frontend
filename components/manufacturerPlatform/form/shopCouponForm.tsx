"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { MAX_AMOUNT, MAX_AMOUNT_LABEL } from "@/lib/number";
import { MandeApiError } from "@/lib/types/api";
import type { ShopCouponPayload } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// ShopCouponForm: a new coupon for a seller's products on MANDE Shop
// (SHOP_IMPLEMENTATION.md 5.8). The seller pays for the discount: it comes off
// their part of the order, and MANDE's charge is worked out on what's left.
// The code, type and amount can't change once it's made (switch it off and
// make another); the dates and limits are optional. Dates are whole Lagos
// days: it starts at the start of its first day and ends at the end of its last.
// ─────────────────────────────────────────────────────────────────────────────

type Values = {
    code: string;
    type: "percentage" | "fixed";
    value: string;
    productIds: string[];
    minSubtotal: string;
    startsAt: string;
    expiresAt: string;
    maxUses: string;
    maxUsesPerCustomer: string;
    description: string;
};

const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;
const MAX_PERCENT = 90;
const MAX_USES = 1_000_000;

const pad = (value: number) => String(value).padStart(2, "0");
/** The date field's value (a local midnight ISO) as a Lagos start or end of that day. */
function toLagosEdge(value: string, edge: "start" | "end"): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return new Date(`${key}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}+01:00`).toISOString();
}

const wholeIn = (value: string, min: number, max: number) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const optionalWhole = (value: string) => !value.trim() || wholeIn(value, 1, MAX_USES) || "Enter a whole number of 1 or more";

export default function ShopCouponForm({
    products,
    onCreate,
    onCancel,
}: {
    /** Their products, to limit the coupon to some of them. */
    products: { id: string; title: string }[];
    onCreate: (payload: ShopCouponPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<Values>({
        mode: "onTouched",
        defaultValues: { code: "", type: "percentage", value: "", productIds: [], minSubtotal: "", startsAt: "", expiresAt: "", maxUses: "", maxUsesPerCustomer: "", description: "" },
    });
    const type = useWatch({ control: methods.control, name: "type" });

    const fields: FormFieldConfig[] = [
        {
            name: "code",
            type: "text",
            label: "Code",
            placeholder: "e.g. SAVE10",
            maxLength: 20,
            autoComplete: "off",
            className: "uppercase",
            description: "What customers type at checkout: 4 to 20 letters and numbers. It can't be changed later.",
            validation: {
                required: "Enter a code",
                setValueAs: (value: string) => value.trim().toUpperCase(),
                validate: (value: string) => CODE_PATTERN.test(value) || "Use 4 to 20 letters and numbers, no spaces",
            },
        },
        {
            name: "type",
            type: "select",
            label: "Discount",
            options: [
                { label: "Percent off", value: "percentage" },
                { label: "Amount off", value: "fixed" },
            ],
            validation: { required: "Pick a discount" },
        },
        type === "fixed"
            ? {
                  name: "value",
                  type: "amount",
                  label: "Amount off",
                  placeholder: "₦0",
                  description: "Taken off once per order, never more than the items it covers.",
                  validation: {
                      required: "Enter an amount",
                      validate: (value: string) => (Number(value) >= 1 ? Number(value) <= MAX_AMOUNT || `Enter at most ${MAX_AMOUNT_LABEL}` : "Enter at least ₦1"),
                  },
              }
            : {
                  name: "value",
                  type: "number",
                  label: "Percent off",
                  placeholder: "10",
                  min: 1,
                  max: MAX_PERCENT,
                  validation: { required: "Enter a percent", validate: (value: string) => wholeIn(value, 1, MAX_PERCENT) || `Enter a whole number from 1 to ${MAX_PERCENT}` },
              },
        {
            name: "productIds",
            type: "multiselect",
            label: "Products (optional)",
            placeholder: "All your products",
            options: products.map((product) => ({ label: product.title, value: product.id })),
        },
        {
            name: "minSubtotal",
            type: "amount",
            label: "Minimum spend (optional)",
            placeholder: "No minimum",
            description: "On the products it covers.",
        },
        { name: "startsAt", type: "date", label: "Starts (optional)", placeholder: "Straight away", minDate: new Date() },
        {
            name: "expiresAt",
            type: "date",
            label: "Ends (optional)",
            placeholder: "No end date",
            minDate: new Date(),
            validation: {
                validate: (value: string, values: Record<string, unknown>) =>
                    !value || !values.startsAt || new Date(value) >= new Date(String(values.startsAt)) || "The end date can't be before the start date",
            },
        },
        { name: "maxUses", type: "number", label: "Total uses (optional)", placeholder: "No limit", min: 1, validation: { validate: optionalWhole } },
        { name: "maxUsesPerCustomer", type: "number", label: "Uses per customer (optional)", placeholder: "No limit", min: 1, validation: { validate: optionalWhole } },
        {
            name: "description",
            type: "textarea",
            label: "Note (optional)",
            placeholder: "e.g. For our Instagram followers",
            height: 72,
            description: "For you. Customers don't see it.",
            validation: { maxLength: { value: 200, message: "Keep it under 200 characters" } },
        },
    ];

    const submit = async (values: Values) => {
        setIsLoading(true);
        try {
            await onCreate({
                code: values.code,
                type: values.type,
                // Amounts are typed in naira and kept in kobo
                value: values.type === "fixed" ? Math.round(Number(values.value) * 100) : Number(values.value),
                productIds: values.productIds,
                minSubtotalKobo: values.minSubtotal ? Math.round(Number(values.minSubtotal) * 100) : 0,
                startsAt: toLagosEdge(values.startsAt, "start"),
                expiresAt: toLagosEdge(values.expiresAt, "end"),
                maxUses: values.maxUses.trim() ? Number(values.maxUses) : null,
                maxUsesPerCustomer: values.maxUsesPerCustomer.trim() ? Number(values.maxUsesPerCustomer) : null,
                description: values.description.trim() || null,
            });
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "COUPON_CODE_TAKEN") {
                methods.setError("code", { message: "That code is taken. Try another." });
                toast.error("That code is taken. Try another.");
            } else {
                toast.error(getErrorMessage(error, "Couldn't make the coupon. Please try again."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<Values>
            methods={methods}
            fields={fields}
            onSubmit={submit}
            isLoading={isLoading}
            rowPairs={[
                ["type", "value"],
                ["startsAt", "expiresAt"],
                ["maxUses", "maxUsesPerCustomer"],
            ]}
            hideRequiredMarks
            renderFooter={({ isLoading: saving, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton label="Make coupon" loadingLabel="Making..." isLoading={saving} disabled={!canSubmit} className="w-auto px-5" />
                </div>
            )}
        />
    );
}
