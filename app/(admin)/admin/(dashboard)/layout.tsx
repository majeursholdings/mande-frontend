import DashboardShell from "@/components/adminPlatform/dashboardLayout/dashboardShell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}
