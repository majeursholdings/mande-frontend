import DashboardShell from "@/components/manufacturerPlatform/dashboardLayout/dashboardShell";

export default function ManufacturerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardShell>{children}</DashboardShell>;
}
