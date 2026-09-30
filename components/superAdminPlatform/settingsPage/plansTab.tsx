"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SettingsSection from "@/components/manufacturerPlatform/settingsSection";
import { NOT_INCLUDED, type PricingPlan } from "@/constant/sampleData";
import PlanForm from "../form/planForm";
import PlanOfferForm from "../form/planOfferForm";
import { useSuperAdminSettings } from "../settingsContext";

/** What a usual price comes to with the offer taken off. */
const withDiscount = (price: number, percent: number) => Math.round((price * (100 - percent)) / 100);

// ─────────────────────────────────────────────────────────────────────────────
// PlansTab — the offer on every plan, then each plan: its usual prices (and
// what they come to with the offer), who it's for and what it includes, and
// Edit plan to change any of it.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlansTab() {
    const { plans, discountPercent, updatePlan, setDiscountPercent } = useSuperAdminSettings();
    const [editing, setEditing] = useState<PricingPlan | null>(null);

    return (
        <div className="flex flex-col gap-6">
            <SettingsSection
                headingLevel="h3"
                title="Plan offer"
                description={
                    discountPercent > 0
                        ? `Every plan is ${discountPercent}% off for now. The website, sign-up and each manufacturer's plan settings show the discounted prices.`
                        : "No offer on for now. Set a discount to take it off every plan's price."
                }
            >
                <PlanOfferForm key={discountPercent} discountPercent={discountPercent} onSave={setDiscountPercent} />
            </SettingsSection>

            <ul className="flex flex-col gap-4">
                {plans.map((plan) => (
                    <li key={plan.id} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <span className="font-mono text-xs font-semibold text-primary-700">{plan.tierNumber}</span>
                                <h3 className="text-base font-semibold font-text text-mist-950">{plan.name}</h3>
                                <p className="text-xs font-text tracking-wide text-mist-500 uppercase">{plan.targetAudience}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditing(plan)}
                                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                            >
                                <Pencil className="size-3.5" aria-hidden />
                                Edit plan
                            </button>
                        </div>

                        <dl className="grid grid-cols-2 gap-3">
                            {(
                                [
                                    ["Monthly", plan.monthlyPrice],
                                    ["Yearly", plan.annualPrice],
                                ] as const
                            ).map(([label, price]) => (
                                <div key={label} className="flex flex-col gap-0.5 rounded-lg bg-mist-50 px-3.5 py-2.5">
                                    <dt className="text-xs font-text text-mist-500">{label}</dt>
                                    <dd className="text-base font-semibold font-text text-mist-950">
                                        {formatPrice(withDiscount(price, discountPercent))}
                                    </dd>
                                    {discountPercent > 0 && (
                                        <dd className="text-xs font-text text-mist-400">
                                            <s>{formatPrice(price)}</s> usually
                                        </dd>
                                    )}
                                </div>
                            ))}
                        </dl>

                        <dl className="flex flex-col">
                            {plan.features.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm font-text last:border-b-0"
                                >
                                    <dt className="text-mist-500">{feature.label}</dt>
                                    <dd
                                        className={cn(
                                            "text-right",
                                            feature.value === NOT_INCLUDED ? "text-mist-400" : "font-medium text-mist-950",
                                        )}
                                    >
                                        {feature.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </li>
                ))}
            </ul>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="max-w-120">
                    {editing && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Edit {editing.name}</DialogTitle>
                                <DialogDescription>
                                    Prices are the usual ones, before any offer. New prices apply from each
                                    manufacturer&apos;s next renewal.
                                </DialogDescription>
                            </div>
                            <PlanForm
                                key={editing.id}
                                plan={editing}
                                onCancel={() => setEditing(null)}
                                onSave={async (changes) => {
                                    try {
                                        await updatePlan(editing.id, changes);
                                        toast.success(`${editing.name} saved`);
                                        setEditing(null);
                                    } catch {
                                        toast.error("Couldn't save the plan. Please try again.");
                                    }
                                }}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
