import type { Metadata } from "next";
import DashboardShell from "@/components/adminPlatform/dashboardLayout/dashboardShell";

export const metadata: Metadata = { title: "Super admin | MANDE" };

// The admin's dashboard frame, with the super admin's nav, profile, notifications and platform settings
export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell platform="super-admin">{children}</DashboardShell>;
}
