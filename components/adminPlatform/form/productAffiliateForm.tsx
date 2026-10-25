"use client";

import { useForm, useWatch } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { mandeStockService, type MandeProduct } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// ProductAffiliateForm: the Affiliate rewards section on a MANDE product
// (SHOP_IMPLEMENTATION.md 5.7). In the system, a sale through a customer's
// referral link or personal coupon earns its owner the shop's reward percent
// of the price, spread over this product's "sales to reach". Staff only:
// manufacturers never see it.
// ─────────────────────────────────────────────────────────────────────────────

type Values = { enabled: boolean; salesToReach: string };

/** The reward percent the example uses (the shop's default; the real one is in Settings › Shop). */
const EXAMPLE_PERCENT = 99;

export default function ProductAffiliateSection({ productId }: { productId: string }) {
    const query = useQuery({ queryKey: ["shop", "mande-product", productId], queryFn: () => mandeStockService.getProduct(productId) });
    if (query.isPending) {
        return (
            <section className="flex flex-col gap-3 border-t border-border pt-5">
                <h3 className="text-base font-semibold font-text text-mist-950">Affiliate rewards</h3>
                <Skeleton className="h-16 w-full bg-gray-300" />
            </section>
        );
    }
    if (query.isError) return <p className="border-t border-border pt-5 text-sm font-text text-error-600">We couldn&apos;t load the affiliate rewards. Please reopen the product.</p>;
    // Remounted after each save so the form starts from what was saved
    return <ProductAffiliateForm key={query.data.updatedAt} product={query.data} />;
}

function ProductAffiliateForm({ product }: { product: MandeProduct }) {
    const queryClient = useQueryClient();
    const methods = useForm<Values>({
        mode: "onTouched",
        defaultValues: { enabled: product.affiliate.enabled, salesToReach: product.affiliate.salesToReach ? String(product.affiliate.salesToReach) : "" },
    });
    const enabled = useWatch({ control: methods.control, name: "enabled" });
    const salesToReach = Number(useWatch({ control: methods.control, name: "salesToReach" }) || 0);
    const price = fromKobo(product.priceKobo);
    const perSale = salesToReach >= 1 ? Math.floor((product.priceKobo * EXAMPLE_PERCENT) / salesToReach / 100) / 100 : null;

    const fields: FormFieldConfig[] = [
        { name: "enabled", type: "checkbox", label: "Customers earn store credit when their link or personal coupon sells this" },
        ...(enabled
            ? ([
                  {
                      name: "salesToReach",
                      type: "number",
                      label: "Sales to reach the full reward",
                      min: 1,
                      max: 1000,
                      description:
                          perSale !== null
                              ? `At a ${EXAMPLE_PERCENT}% reward, each sale earns ${formatPrice(perSale)} of the ${formatPrice(price)} price, ${formatPrice(perSale * salesToReach)} after ${salesToReach}.`
                              : "The reward is spread over this many sales. Fewer sales means a bigger reward on each.",
                      validation: {
                          required: "Say how many sales earn the full reward",
                          validate: (value: string) => (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 1000) || "Enter a whole number from 1 to 1,000",
                      },
                  },
              ] satisfies FormFieldConfig[])
            : []),
    ];

    const save = async (values: Values) => {
        try {
            await mandeStockService.setAffiliate(product.id, { enabled: values.enabled, salesToReach: values.enabled ? Number(values.salesToReach) : null });
            await queryClient.invalidateQueries({ queryKey: ["shop", "mande-product", product.id] });
            toast.success(values.enabled ? "Affiliate rewards on" : "Affiliate rewards off");
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't save the affiliate rewards. Please try again."));
        }
    };

    return (
        <section className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold font-text text-mist-950">Affiliate rewards</h3>
                <p className="text-sm font-text text-mist-500">MANDE pays referral rewards as store credit. The reward percent is set in Settings › Shop.</p>
            </div>
            <MainForm<Values>
                methods={methods}
                fields={fields}
                onSubmit={save}
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end pt-1">
                        <FormSubmitButton label="Save rewards" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !methods.formState.isDirty} className="w-auto px-6" />
                    </div>
                )}
            />
        </section>
    );
}
