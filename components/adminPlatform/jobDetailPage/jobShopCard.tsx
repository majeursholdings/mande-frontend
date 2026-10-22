"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { jobsService } from "@/lib/services/jobsService";
import { DetailSection } from "./detailParts";

// ─────────────────────────────────────────────────────────────────────────────
// JobShopCard: the shop side of a job (SHOP_IMPLEMENTATION.md 5.2.4 and
// 5.2.6). A job making a MANDE stock order shows the order (code, product,
// the customer's state, never their phone); a signed-off job can be put on
// the shop as a draft MANDE product, the piece itself or the design made to
// order, by its lead or a super admin. Products already made from it are
// listed. Shown only when there's something to show.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobShopCard({ jobId, canAct, shopBase }: { jobId: string; canAct: boolean; shopBase: string }) {
    const queryClient = useQueryClient();
    const queryKey = ["jobs", jobId, "shop"];
    const query = useQuery({ queryKey, queryFn: () => jobsService.getJobShop(jobId), staleTime: 30_000 });
    const [busy, setBusy] = useState<"piece" | "design" | null>(null);

    if (query.isError) return null;
    if (query.isPending) {
        return (
            <DetailSection title="Shop">
                <Skeleton className="h-12 w-full bg-gray-300" />
            </DetailSection>
        );
    }
    const card = query.data;
    const canPut = card.canPutOnShop && canAct;
    if (!card.shopOrder && card.products.length === 0 && !canPut) return null;

    const putOnShop = async (kind: "piece" | "design") => {
        setBusy(kind);
        try {
            const product = await jobsService.putOnShop(jobId, kind);
            await queryClient.invalidateQueries({ queryKey });
            toast.success(`${product.title} is a draft in MANDE stock. Set its price, category and delivery, then list it.`);
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't put this job on the shop. Please try again."));
        } finally {
            setBusy(null);
        }
    };

    return (
        <DetailSection title="Shop">
            {card.shopOrder && (
                <div className="flex flex-col gap-1 rounded-lg bg-mist-50 px-4 py-3 text-sm font-text">
                    <p className="text-mist-950">
                        Makes{" "}
                        <Link href={`${shopBase}/orders?order=${card.shopOrder.orderId}`} className="font-medium text-primary-700 underline-offset-2 hover:underline">
                            order {card.shopOrder.code}
                        </Link>
                        {card.shopOrder.productTitle ? `: ${card.shopOrder.quantity ?? 1} × ${card.shopOrder.productTitle}` : ""}
                    </p>
                    {card.shopOrder.state && <p className="text-mist-500">For a customer in {card.shopOrder.state}</p>}
                    {!card.shopOrder.active && <p className="text-error-600">Closed: the order line needs a new job, or a refund.</p>}
                </div>
            )}
            {card.products.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm font-text">
                    {card.products.map((product) => (
                        <li key={product.id} className="text-mist-800">
                            On the shop as{" "}
                            <Link href={`${shopBase}/products`} className="font-medium text-primary-700 underline-offset-2 hover:underline">
                                {product.title}
                            </Link>{" "}
                            <span className="text-mist-500">({product.madeToOrder ? "made to order" : "in stock"}, {product.status === "listed" ? "listed" : product.status.replace(/_/g, " ")})</span>
                        </li>
                    ))}
                </ul>
            )}
            {canPut && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-text text-mist-500">Put it on the shop as a draft: this piece as it is, or the design for customers to order.</p>
                    <div className="flex flex-wrap gap-2">
                        {(["piece", "design"] as const).map((kind) => (
                            <Button
                                key={kind}
                                type="button"
                                disabled={busy !== null}
                                onClick={() => putOnShop(kind)}
                                className="h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer"
                            >
                                {busy === kind ? "Adding..." : kind === "piece" ? "Sell this piece" : "Sell this design, made to order"}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </DetailSection>
    );
}
