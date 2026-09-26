import { ReactNode } from "react";
import DashboardSidebar from "./sidebar";
import DesktopTopbar from "./desktopTopbar";
import MobileTopbar from "./mobileTopbar";
import MobileBottomNav from "./mobileBottomNav";

export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <div className="flex bg-mist-50">
            <DashboardSidebar />
            <div className="flex flex-1 flex-col min-w-0 h-dvh overflow-x-hidden overflow-y-auto">
                <DesktopTopbar />
                <MobileTopbar />
                <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
                    {children}
                </main>
                <MobileBottomNav />
            </div>
        </div>
    );
}
