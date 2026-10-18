import type { ReactNode } from "react";
import { ManufacturerShopLayout } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopRouteLayout({ children }: { children: ReactNode }) {
    return <ManufacturerShopLayout>{children}</ManufacturerShopLayout>;
}
