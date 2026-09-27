import type { ReactNode } from "react";
import DashboardSidebar from "./sidebar";
import DesktopTopbar from "./desktopTopbar";
import MobileTopbar from "./mobileTopbar";
import MobileBottomNav from "./mobileBottomNav";
import { LogoutProvider } from "./logoutContext";
import { NotificationsProvider } from "./notificationsContext";
import { AdminJobsProvider } from "./adminJobsContext";

/** The admin dashboard frame — sidebar and top bar from lg up, top and bottom bars on phones. */
export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <LogoutProvider>
            <NotificationsProvider>
                <AdminJobsProvider>
                    <div className="flex bg-white">
                        <DashboardSidebar />
                        {/* `relative` makes this scroll area the containing block for absolutely
                            positioned content inside it (e.g. sr-only text); without it they're
                            placed against the page, poke out past the fold and scroll the page too */}
                        <div className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                            <DesktopTopbar />
                            <MobileTopbar />
                            <main className="flex-1 px-4 pt-6 pb-28 lg:px-10 lg:pt-6 lg:pb-10">
                                {children}
                            </main>
                            <MobileBottomNav />
                        </div>
                    </div>
                </AdminJobsProvider>
            </NotificationsProvider>
        </LogoutProvider>
    );
}
