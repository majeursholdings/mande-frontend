"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { ReturnsApi, ShopReturnRow } from "@/lib/services/shopService";
import { FormCancelButton, FormSubmitButton } from "./formButtons";

export type ReturnAction = "approve" | "reject" | "refund";

type Values = { instructions: string; reason: string; restock: boolean };

// ─────────────────────────────────────────────────────────────────────────────
// ReturnActionForm: a seller (or staff, for MANDE stock) answering a return.
//  • approve: where and how the customer sends it back (they pay to send it)
//  • reject: why not, before it's sent or once it's back and not as agreed
//  • refund: it's back and as agreed; whether it goes back on sale (a change
//    of mind does by default, a problem doesn't)
// The API checks the return is still where this started (409 otherwise).
// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnActionForm({
    entry,
    action,
    api,
    onDone,
    onCancel,
}: {
    entry: ShopReturnRow;
    action: ReturnAction;
    api: Pick<ReturnsApi, "approveReturn" | "rejectReturn" | "refundReturn">;
    onDone: (updated: ShopReturnRow) => void;
    onCancel: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const methods = useForm<Values>({ mode: "onTouched", defaultValues: { instructions: "", reason: "", restock: entry.reason === "changed_mind" } });
    const refund = formatPrice(fromKobo(entry.amountKobo));

    const fields: FormFieldConfig[] =
        action === "approve"
            ? [
                  {
                      name: "instructions",
                      type: "textarea",
                      label: "Where and how should they send it back?",
                      placeholder: "e.g. Drop it at our Ikeja workshop, 4 Allen Avenue, weekdays 9am to 5pm, or send it by GIG to the same address.",
                      height: 110,
                      validation: {
                          validate: (value: string) => {
                              const length = value.trim().length;
                              return length < 10 ? "Say where and how (at least 10 characters)" : length > 1000 ? "Keep it under 1,000 characters" : true;
                          },
                      },
                  },
              ]
            : action === "reject"
              ? [
                    {
                        name: "reason",
                        type: "textarea",
                        label: "Why are you not accepting it?",
                        placeholder: entry.status === "sent" ? "e.g. It came back used and scratched." : "e.g. The photos show wear from use, not a fault.",
                        description: "The customer sees this. They can contact MANDE support if they disagree.",
                        height: 96,
                        validation: {
                            validate: (value: string) => {
                                const length = value.trim().length;
                                return length < 3 ? "Say why" : length > 500 ? "Keep it under 500 characters" : true;
                            },
                        },
                    },
                ]
              : [
                    {
                        name: "restock",
                        type: "checkbox",
                        label: "Put it back in stock (it can be sold again)",
                    },
                ];

    const submit = async (values: Values) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const updated =
                action === "approve"
                    ? await api.approveReturn(entry.code, values.instructions.trim())
                    : action === "reject"
                      ? await api.rejectReturn(entry.code, values.reason.trim())
                      : await api.refundReturn(entry.code, values.restock);
            toast.success(
                action === "approve"
                    ? "Approved. The customer has been told how to send it back."
                    : action === "reject"
                      ? "Return not accepted. The customer has been told why."
                      : `Refunded ${refund} ${entry.refundMethod === "credit" ? "as store credit" : "to their card"}.`,
            );
            onDone(updated);
        } catch (error) {
            toast.error(getErrorMessage(error, "That didn't save. Refresh to see where the return is now."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {action === "refund" && (
                <p className="text-sm text-mist-700">
                    Only refund once it&apos;s back and you&apos;ve checked it. The customer gets <span className="font-semibold text-mist-950">{refund}</span>{" "}
                    {entry.refundMethod === "credit" ? "as store credit" : "back to their card"}.
                </p>
            )}
            <MainForm<Values>
                methods={methods}
                fields={fields}
                onSubmit={submit}
                requireValidToSubmit={action !== "refund"}
                renderFooter={({ canSubmit }) => (
                    <div className="flex justify-end gap-3">
                        <FormCancelButton onClick={onCancel} disabled={isSubmitting}>
                            Back
                        </FormCancelButton>
                        <FormSubmitButton
                            label={action === "approve" ? "Approve return" : action === "reject" ? "Don't accept" : `Refund ${refund}`}
                            loadingLabel="Saving..."
                            isLoading={isSubmitting}
                            disabled={!canSubmit}
                        />
                    </div>
                )}
            />
        </div>
    );
}
