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

/** The admin dashboard frame — sidebar and top bar from lg up, top and bottom bars on phones. */
export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <LogoutProvider>
            <AdminProfileProvider>
                <NotificationsProvider>
                    <AdminJobsProvider>
                        <AdminManufacturersProvider>
                            <DashboardFrame
                                sidebar={<DashboardSidebar />}
                                desktopTopbar={<DesktopTopbar />}
                                mobileTopbar={<MobileTopbar />}
                                bottomNav={<MobileBottomNav />}
                            >
                                {children}
                            </DashboardFrame>
                        </AdminManufacturersProvider>
                    </AdminJobsProvider>
                </NotificationsProvider>
            </AdminProfileProvider>
        </LogoutProvider>
    );
}
