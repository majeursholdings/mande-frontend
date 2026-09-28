import type { ReactNode } from "react";
import DashboardFrame from "@/components/ui/dashboardFrame";
import DashboardSidebar from "./sidebar";
import DesktopTopbar from "./desktopTopbar";
import MobileTopbar from "./mobileTopbar";
import MobileBottomNav from "./mobileBottomNav";
import { LogoutProvider } from "./logoutContext";
import { NotificationsProvider } from "./notificationsContext";
import { AdminJobsProvider } from "./adminJobsContext";
import { AdminManufacturersProvider } from "./adminManufacturersContext";
import { AdminProfileProvider } from "./adminProfileContext";
import { StaffPlatformProvider, type StaffPlatformKey } from "./staffPlatformContext";
import { SuperAdminSettingsProvider } from "@/components/superAdminPlatform/settingsContext";

/**
 * The staff dashboard frame, for the admin or the super admin — sidebar and
 * top bar from lg up, top and bottom bars on phones.
 */
export default function DashboardShell({
    platform = "admin",
    children,
}: {
    platform?: StaffPlatformKey;
    children: ReactNode;
}) {
    const frame = (
        <DashboardFrame
            sidebar={<DashboardSidebar />}
            desktopTopbar={<DesktopTopbar />}
            mobileTopbar={<MobileTopbar />}
            bottomNav={<MobileBottomNav />}
        >
            {children}
        </DashboardFrame>
    );

    return (
        <StaffPlatformProvider platform={platform}>
            <LogoutProvider>
                <AdminProfileProvider>
                    <NotificationsProvider>
                        <AdminJobsProvider>
                            <AdminManufacturersProvider>
                                {platform === "super-admin" ? (
                                    // Their platform settings, round the whole frame: the sidebar counts what's waiting too
                                    <SuperAdminSettingsProvider>{frame}</SuperAdminSettingsProvider>
                                ) : (
                                    frame
                                )}
                            </AdminManufacturersProvider>
                        </AdminJobsProvider>
                    </NotificationsProvider>
                </AdminProfileProvider>
            </LogoutProvider>
        </StaffPlatformProvider>
    );
}
