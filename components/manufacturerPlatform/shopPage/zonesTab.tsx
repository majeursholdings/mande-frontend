"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil } from "lucide-react";
import DeliveryZonesForm from "@/components/manufacturerPlatform/form/deliveryZonesForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeliveryZone, SellerShopApi } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// ZonesTab: the seller's delivery zones, and editing them. Each product then
// sets a fee for the zones it goes to. Used for a manufacturer's store and
// MANDE's own stock.
// ─────────────────────────────────────────────────────────────────────────────

export default function ZonesTab({
    api,
    zones,
    isLoading,
    onChanged,
}: {
    api: SellerShopApi;
    zones: DeliveryZone[] | undefined;
    isLoading: boolean;
    onChanged: () => Promise<unknown>;
}) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing && zones) {
        return (
            <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 lg:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold font-text text-mist-950">Edit delivery zones</h2>
                    <p className="text-sm font-text text-mist-500">Group states you charge the same to deliver to. Each state can be in one zone.</p>
                </div>
                <DeliveryZonesForm
                    zones={zones}
                    onCancel={() => setIsEditing(false)}
                    onSave={async (next) => {
                        await api.setDeliveryZones(next);
                        await onChanged();
                        toast.success("Delivery zones saved");
                        setIsEditing(false);
                    }}
                />
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold font-text text-mist-950">Delivery zones</h2>
                    <p className="max-w-xl text-sm font-text text-mist-500">
                        MANDE doesn&apos;t deliver: you do. Group the states you deliver to, then set a fee for each zone on your products.
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={!zones}
                    className="h-10 gap-1.5 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                >
                    <Pencil className="size-4" />
                    {zones && zones.length > 0 ? "Edit zones" : "Add zones"}
                </Button>
            </div>

            {isLoading ? (
                <ul className="flex flex-col gap-3" aria-hidden>
                    {[0, 1].map((index) => (
                        <li key={index} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-64" />
                        </li>
                    ))}
                </ul>
            ) : !zones || zones.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm font-text text-mist-500">
                    No delivery zones yet. Add one for each area you charge differently for, e.g. Lagos, South West, and the rest of Nigeria.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {zones.map((zone) => (
                        <li key={zone.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden />
                            <span className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium font-text text-mist-950">{zone.name}</span>
                                <span className="text-xs font-text text-mist-500">{zone.states.join(", ")}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
