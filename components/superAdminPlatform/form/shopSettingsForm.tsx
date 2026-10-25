"use client";

import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ShopSettings } from "@/constant/superAdmin";
import { api, getErrorMessage } from "@/lib/api";
import type { AffiliateCost } from "@/lib/services/customerService";
import { formatPrice } from "@/lib/currency";
import ReauthSteps from "../reauthSteps";
import FormFieldsSkeleton from "./formFieldsSkeleton";

type ShopSettingsValues = {
    sellingOn: boolean;
    chargeType: "percentage" | "flat";
    /** A whole percent, when the charge is a percentage. */
    chargePercent: string;
    /** Naira, digits only (the amount field), when the charge is flat. */
    chargeAmount: string;
    flatBasis: "order" | "line" | "unit";
    deliveryConfirmDays: string;
    problemReportDays: string;
    reviewWindowDays: string;
    debtGraceDays: string;
    returnWindowDays: string;
    returnSendBackDays: string;
    returnGraceDays: string;
    payoutDelayHours: string;
    minJobMarginPercent: string;
    jobLeadBufferDays: string;
    lowRatingBelow: string;
    lowRatingMinReviews: string;
    affiliateOn: boolean;
    linkRewardPercent: string;
    couponRewardPercent: string;
    attributionDays: string;
    creditExpiryDays: string;
    costWarningPercent: string;
};

const DEFAULT_AFFILIATE = {
    enabled: false,
    link: { rewardPercent: 99, attributionDays: 30 },
    coupon: { rewardPercent: 99 },
    creditExpiryDays: 90,
    costWarningPercent: 50,
};

/** The affiliate example: a ₦100,000 MANDE product with its full reward after 3 sales. */
const AFFILIATE_EXAMPLE = { price: 100_000, salesToReach: 3 };

/** The worked example under the charge: one line of 2 units at ₦50,000 each. */
const EXAMPLE = { unitPrice: 50_000, units: 2, lines: 1 };

const wholeNumber = (min: number, max: number) => (value: string) =>
    (value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max) || `Enter a whole number from ${min} to ${max}`;

function toValues(settings: ShopSettings): ShopSettingsValues {
    const flat = settings.platformCharge.type === "flat";
    const affiliate = settings.affiliate ?? DEFAULT_AFFILIATE;
    return {
        sellingOn: settings.manufacturerSellingEnabled,
        chargeType: settings.platformCharge.type,
        chargePercent: flat ? "" : String(settings.platformCharge.value),
        chargeAmount: flat ? String(Math.round(settings.platformCharge.value / 100)) : "",
        flatBasis: settings.platformCharge.flatBasis,
        deliveryConfirmDays: String(settings.deliveryConfirmDays),
        problemReportDays: String(settings.problemReportDays),
        reviewWindowDays: String(settings.reviewWindowDays),
        debtGraceDays: String(settings.debtGraceDays),
        returnWindowDays: String(settings.returnWindowDays ?? 7),
        returnSendBackDays: String(settings.returnSendBackDays ?? 7),
        returnGraceDays: String(settings.returnGraceDays ?? 7),
        payoutDelayHours: String(settings.payoutDelayHours ?? 24),
        minJobMarginPercent: String(settings.minJobMarginPercent ?? 20),
        jobLeadBufferDays: String(settings.jobLeadBufferDays ?? 3),
        lowRatingBelow: String(settings.lowRatingAlert.belowRating),
        lowRatingMinReviews: String(settings.lowRatingAlert.minReviews),
        affiliateOn: affiliate.enabled,
        linkRewardPercent: String(affiliate.link.rewardPercent),
        couponRewardPercent: String(affiliate.coupon.rewardPercent),
        attributionDays: String(affiliate.link.attributionDays),
        creditExpiryDays: String(affiliate.creditExpiryDays),
        costWarningPercent: String(affiliate.costWarningPercent ?? 50),
    };
}

function toSettings(values: ShopSettingsValues): ShopSettings {
    const flat = values.chargeType === "flat";
    return {
        manufacturerSellingEnabled: values.sellingOn,
        platformCharge: {
            type: values.chargeType,
            value: flat ? Math.round(Number(values.chargeAmount) * 100) : Number(values.chargePercent),
            flatBasis: values.flatBasis,
        },
        deliveryConfirmDays: Number(values.deliveryConfirmDays),
        problemReportDays: Number(values.problemReportDays),
        reviewWindowDays: Number(values.reviewWindowDays),
        debtGraceDays: Number(values.debtGraceDays),
        returnWindowDays: Number(values.returnWindowDays),
        returnSendBackDays: Number(values.returnSendBackDays),
        returnGraceDays: Number(values.returnGraceDays),
        payoutDelayHours: Number(values.payoutDelayHours),
        minJobMarginPercent: Number(values.minJobMarginPercent),
        jobLeadBufferDays: Number(values.jobLeadBufferDays),
        lowRatingAlert: {
            belowRating: Number(values.lowRatingBelow),
            minReviews: Number(values.lowRatingMinReviews),
        },
        affiliate: {
            enabled: values.affiliateOn,
            link: {
                rewardPercent: Number(values.linkRewardPercent),
                attributionDays: Number(values.attributionDays),
            },
            coupon: { rewardPercent: Number(values.couponRewardPercent) },
            creditExpiryDays: Number(values.creditExpiryDays),
            costWarningPercent: Number(values.costWarningPercent),
        },
    };
}

/** What MANDE keeps from the example sale, as SHOP_IMPLEMENTATION.md 3.2 works it out (never more than the items). */
function exampleCharge(values: Partial<ShopSettingsValues>): number {
    const subtotal = EXAMPLE.unitPrice * EXAMPLE.units;
    if (values.chargeType === "flat") {
        const amount = Number(values.chargeAmount) || 0;
        const times = values.flatBasis === "unit" ? EXAMPLE.units : values.flatBasis === "line" ? EXAMPLE.lines : 1;
        return Math.min(amount * times, subtotal);
    }
    return Math.min(Math.round((subtotal * (Number(values.chargePercent) || 0)) / 100), subtotal);
}

const DAY_FIELDS: FormFieldConfig[] = [
    {
        name: "deliveryConfirmDays",
        type: "number",
        label: "Delivered after (days)",
        description: "A shipped order counts as delivered after this, unless the customer says so first.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 60),
        },
    },
    {
        name: "problemReportDays",
        type: "number",
        label: "Problem reports (days)",
        description: "How long after delivery a customer can report a problem.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 60),
        },
    },
    {
        name: "reviewWindowDays",
        type: "number",
        label: "Reviews (days)",
        description: "How long after delivery a customer can review the product and seller.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 365),
        },
    },
    {
        name: "debtGraceDays",
        type: "number",
        label: "Refund repayment (days)",
        description: "How long a seller has to pay back their share of a refund before their products are paused.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 90),
        },
    },
    {
        name: "returnWindowDays",
        type: "number",
        label: "Returns (days)",
        description: "How long after delivery a customer can ask to return something. The returns policy says 7.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 60),
        },
    },
    {
        name: "returnSendBackDays",
        type: "number",
        label: "Send it back within (days)",
        description: "Once a return is approved, how long the customer has to send it.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 60),
        },
    },
    {
        name: "returnGraceDays",
        type: "number",
        label: "Grace before a return lapses (days)",
        description: "Extra days after that before an approved return that wasn't sent closes.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(0, 60),
        },
    },
    {
        name: "payoutDelayHours",
        type: "number",
        label: "Seller's share paid after (hours)",
        description: "How long after delivery a manufacturer's share goes to their wallet.",
        validation: {
            required: "Enter a number of hours",
            validate: wholeNumber(1, 720),
        },
    },
    {
        name: "minJobMarginPercent",
        type: "number",
        label: "MANDE stock jobs: minimum margin (%)",
        description: "Saving a job template that leaves less than this between the price and the manufacturer's pay asks to confirm.",
        validation: {
            required: "Enter a percentage",
            validate: wholeNumber(0, 90),
        },
    },
    {
        name: "jobLeadBufferDays",
        type: "number",
        label: "MANDE stock jobs: lead time buffer (days)",
        description: "Added to a job template's production days for the lead time customers see.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(0, 60),
        },
    },
    {
        name: "lowRatingBelow",
        type: "number",
        label: "Low rating: below",
        description: "Flags a seller to staff when their rating falls below this (1 to 5).",
        step: 0.1,
        validation: {
            required: "Enter a rating",
            validate: (value: string) => (Number(value) >= 1 && Number(value) <= 5 && /^\d(\.\d)?$/.test(value.trim())) || "Enter a rating from 1 to 5, to one decimal place",
        },
    },
    {
        name: "lowRatingMinReviews",
        type: "number",
        label: "Low rating: once they have",
        description: "Reviews needed before the alert counts, so one bad review doesn't flag a new seller.",
        validation: {
            required: "Enter a number of reviews",
            validate: wholeNumber(1, 1000),
        },
    },
];

const AFFILIATE_FIELDS: FormFieldConfig[] = [
    {
        name: "affiliateOn",
        type: "checkbox",
        label: "Affiliates are on: customers earn store credit when their link or personal coupon leads to a MANDE stock sale. Off stops links and coupons working; credit already earned can still be spent.",
    },
    {
        name: "linkRewardPercent",
        type: "number",
        label: "Referral link reward (%)",
        description: "Of the price, earned over the product's sales to reach (set on each MANDE product).",
        validation: {
            required: "Enter a percentage",
            validate: wholeNumber(1, 100),
        },
    },
    {
        name: "couponRewardPercent",
        type: "number",
        label: "Personal coupon reward (%)",
        description: "The same, for sales through a personal coupon. The buyer's discount is set on each coupon.",
        validation: {
            required: "Enter a percentage",
            validate: wholeNumber(1, 100),
        },
    },
    {
        name: "attributionDays",
        type: "number",
        label: "Link remembered for (days)",
        description: "How long after someone clicks a referral link a purchase still counts for it.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 365),
        },
    },
    {
        name: "creditExpiryDays",
        type: "number",
        label: "Affiliate credit expires after (days)",
        description: "Counted from when it can be spent. Return credit never expires.",
        validation: {
            required: "Enter a number of days",
            validate: wholeNumber(1, 730),
        },
    },
    {
        name: "costWarningPercent",
        type: "number",
        label: "Warn when one sale costs MANDE over (%)",
        description: "Of the price: the reward per sale, plus a personal coupon's discount. Shown here and on the personal coupon form.",
        validation: { required: "Enter a percentage", validate: wholeNumber(1, 200) },
    },
];

const ROW_PAIRS: [string, string][] = [
    ["linkRewardPercent", "couponRewardPercent"],
    ["attributionDays", "creditExpiryDays"],
    ["deliveryConfirmDays", "problemReportDays"],
    ["reviewWindowDays", "debtGraceDays"],
    ["returnWindowDays", "returnSendBackDays"],
    ["returnGraceDays", "payoutDelayHours"],
    ["minJobMarginPercent", "jobLeadBufferDays"],
    ["lowRatingBelow", "lowRatingMinReviews"],
];

/**
 * The shop's rules: whether manufacturers can sell, MANDE's charge on each
 * sale (with a worked example), who pays Paystack's fee, and the day limits
 * orders and reviews follow. It sets where money goes, so saving asks you to
 * confirm it's you (the API asks for the same). Orders keep the charge they
 * were placed under.
 */
export default function ShopSettingsForm({ settings, onSave }: { settings: ShopSettings; onSave: (settings: ShopSettings, reauthToken: string) => Promise<void> }) {
    const [pending, setPending] = useState<{
        settings: ShopSettings;
        submitted: ShopSettingsValues;
    } | null>(null);
    const methods = useForm<ShopSettingsValues>({
        mode: "onTouched",
        defaultValues: toValues(settings),
    });
    const chargeType = useWatch({ control: methods.control, name: "chargeType" });

    const fields: FormFieldConfig[] = [
        {
            name: "sellingOn",
            type: "checkbox",
            label: "Manufacturers can sell on the shop. Off takes every manufacturer's products off it (orders already paid carry on, and MANDE stock stays).",
        },
        {
            name: "chargeType",
            type: "radio",
            label: "MANDE's charge on each sale",
            options: [
                { value: "percentage", label: "A percentage of the item price" },
                { value: "flat", label: "A flat amount" },
            ],
        },
        ...(chargeType === "flat"
            ? ([
                  {
                      name: "chargeAmount",
                      type: "amount",
                      label: "Flat charge",
                      placeholder: "e.g. 2,000",
                      validation: {
                          required: "Enter the charge",
                          validate: (value: string) => Number(value) <= 10_000_000 || "That charge is too high",
                      },
                  },
                  {
                      name: "flatBasis",
                      type: "radio",
                      label: "Charged per",
                      options: [
                          { value: "order", label: "Order (per seller)" },
                          { value: "line", label: "Item line" },
                          { value: "unit", label: "Unit" },
                      ],
                  },
              ] satisfies FormFieldConfig[])
            : ([
                  {
                      name: "chargePercent",
                      type: "number",
                      label: "Charge (%)",
                      placeholder: "e.g. 5",
                      description: "Of the item price only: delivery fees go to the seller in full.",
                      validation: {
                          required: "Enter a percent",
                          validate: wholeNumber(0, 50),
                      },
                  },
              ] satisfies FormFieldConfig[])),
        ...DAY_FIELDS,
        ...AFFILIATE_FIELDS,
    ];

    const save = async (reauthToken: string) => {
        if (!pending) return;
        try {
            await onSave(pending.settings, reauthToken);
            methods.reset(pending.submitted);
            toast.success("Shop settings saved");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save the shop settings. Please try again."));
        }
        setPending(null);
    };

    return (
        <>
            <MainForm<ShopSettingsValues>
                methods={methods}
                fields={fields}
                rowPairs={ROW_PAIRS}
                onSubmit={(submitted) => {
                    try {
                        setPending({ settings: toSettings(submitted), submitted });
                    } catch {
                        toast.error("Couldn't check the shop settings. Please try again.");
                    }
                }}
                hideRequiredMarks
                footerSlot={
                    <div className="flex flex-col gap-3">
                        <ChargeExample control={methods.control} />
                        <AffiliateExample control={methods.control} />
                    </div>
                }
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton label="Save shop settings" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !methods.formState.isDirty} className="w-auto px-6" />
                    </div>
                )}
            />
            <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Save the shop settings?</DialogTitle>
                        <DialogDescription>
                            New orders follow them. Orders already placed keep the charge they were placed under.
                            {pending && !pending.settings.manufacturerSellingEnabled && settings.manufacturerSellingEnabled
                                ? " Turning selling off takes every manufacturer's products off the shop."
                                : ""}
                        </DialogDescription>
                    </div>
                    <ReauthSteps confirmLabel="Save shop settings" onCancel={() => setPending(null)} onConfirmed={save} />
                </DialogContent>
            </Dialog>
        </>
    );
}

/** What MANDE would keep from an example sale, as the charge is filled in. */
function ChargeExample({ control }: { control: Control<ShopSettingsValues> }) {
    const values = useWatch({ control });
    const subtotal = EXAMPLE.unitPrice * EXAMPLE.units;
    const charge = exampleCharge(values);
    return (
        <p className="rounded-lg bg-mist-50 px-4 py-3 text-sm font-text text-mist-700" aria-live="polite">
            For example, on {EXAMPLE.units} units at {formatPrice(EXAMPLE.unitPrice)} (one line, {formatPrice(subtotal)}), MANDE keeps{" "}
            <span className="font-medium text-mist-950">{formatPrice(charge)}</span> and the seller gets <span className="font-medium text-mist-950">{formatPrice(subtotal - charge)}</span>, plus
            delivery
            {", in their wallet a day after delivery. Paystack's fee on the payment is MANDE's."}
        </p>
    );
}

/** What a referral earns its owner on the example product, and what it costs MANDE per sale. */
function AffiliateExample({ control }: { control: Control<ShopSettingsValues> }) {
    const values = useWatch({ control });
    const { price, salesToReach } = AFFILIATE_EXAMPLE;
    // Kobo, floored per sale as the shop works it out
    const perSale = (percent: string | undefined) => Math.floor((price * 100 * (Number(percent) || 0)) / salesToReach / 100) / 100;
    const link = perSale(values.linkRewardPercent);
    const coupon = perSale(values.couponRewardPercent);
    // The lowest "sales to reach" on a listed MANDE product gives the biggest reward per sale
    const cost = useQuery({
        queryKey: ["shop", "affiliate-cost"],
        queryFn: async () => (await api.get<{ cost: AffiliateCost }>("/shop-admin/affiliate/cost")).data.cost,
        staleTime: 60_000,
    }).data;
    const worstPercent = cost?.lowestSalesToReach != null ? Math.max(Number(values.linkRewardPercent) || 0, Number(values.couponRewardPercent) || 0) / cost.lowestSalesToReach : null;
    const line = Number(values.costWarningPercent) || cost?.warnAbovePercent || 50;
    return (
        <div className="flex flex-col gap-3">
            {worstPercent !== null && cost && worstPercent > line && (
                <p role="status" className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-text text-mist-900">
                    &quot;{cost.product?.title}&quot; reaches its full reward in {cost.lowestSalesToReach} {cost.lowestSalesToReach === 1 ? "sale" : "sales"}, so one referred sale could cost MANDE{" "}
                    {Math.round(worstPercent * 10) / 10}% of its price, over {line}%. Personal coupons add their discount on top.
                </p>
            )}
            <p className="rounded-lg bg-mist-50 px-4 py-3 text-sm font-text text-mist-700" aria-live="polite">
                For example, a {formatPrice(price)} MANDE product with its full reward after {salesToReach} sales: each sale through a link earns the owner{" "}
                <span className="font-medium text-mist-950">{formatPrice(link)}</span> ({formatPrice(link * salesToReach)} in all), and each through a personal coupon{" "}
                <span className="font-medium text-mist-950">{formatPrice(coupon)}</span>, plus the buyer&apos;s discount. MANDE pays for it, as store credit.
            </p>
        </div>
    );
}

/** The shop settings while they load: the labels show, the values are skeletons. */
export function ShopSettingsFormSkeleton() {
    return (
        <FormFieldsSkeleton
            fields={[...DAY_FIELDS, ...AFFILIATE_FIELDS]
                .filter(({ type }) => type !== "checkbox")
                .map(({ name, label, description }) => ({
                    name,
                    label: String(label ?? ""),
                    description: typeof description === "string" ? description : undefined,
                }))}
            rowPairs={ROW_PAIRS}
            submitLabel="Save shop settings"
        />
    );
}
