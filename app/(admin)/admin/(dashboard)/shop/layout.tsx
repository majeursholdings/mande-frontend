import type { ReactNode } from "react";
import { StaffShopLayout } from "@/components/superAdminPlatform/shopPage";

export default function StaffShopRouteLayout({ children }: { children: ReactNode }) {
    return <StaffShopLayout>{children}</StaffShopLayout>;
}
