import { ReactNode } from "react";
import DashboardFrame from "@/components/ui/dashboardFrame";
import DashboardSidebar from "./sidebar";
import DesktopTopbar from "./desktopTopbar";
import MobileTopbar from "./mobileTopbar";
import MobileBottomNav from "./mobileBottomNav";
import AccountGate from "./accountGate";
import AccountStatusBanner from "./accountStatusBanner";
import BusinessDocumentsGate from "./businessDocumentsGate";
import { ManufacturerAccountProvider } from "./manufacturerAccountContext";
import { ManufacturerProfileProvider } from "./manufacturerProfileContext";
import { ManufacturerSubscriptionProvider } from "./manufacturerSubscriptionContext";
import { JobApplicationsProvider } from "./jobApplicationsContext";
import { ManufacturerWalletProvider } from "./manufacturerWalletContext";
import { NotificationsProvider } from "./notificationsContext";
import { RecentSearchesProvider } from "./recentSearchesContext";
import { LeadReviewsProvider } from "./leadReviewsContext";
import LeadReviewPrompt from "./leadReviewPrompt";

export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <ManufacturerAccountProvider>
            {/* Suspended: only the appeal screen, in place of the whole dashboard */}
            <AccountGate>
                <ManufacturerProfileProvider>
                    <ManufacturerWalletProvider>
                        <ManufacturerSubscriptionProvider>
                            <JobApplicationsProvider>
                                <NotificationsProvider>
                                    <RecentSearchesProvider>
                                        <LeadReviewsProvider>
                                            <DashboardFrame
                                                sidebar={<DashboardSidebar />}
                                                desktopTopbar={<DesktopTopbar />}
                                                mobileTopbar={<MobileTopbar />}
                                                bottomNav={<MobileBottomNav />}
                                                beforeContent={<AccountStatusBanner />}
                                            >
                                                {children}
                                            </DashboardFrame>
                                            <BusinessDocumentsGate />
                                            {/* The first thing they see once a job is completed */}
                                            <LeadReviewPrompt />
                                        </LeadReviewsProvider>
                                    </RecentSearchesProvider>
                                </NotificationsProvider>
                            </JobApplicationsProvider>
                        </ManufacturerSubscriptionProvider>
                    </ManufacturerWalletProvider>
                </ManufacturerProfileProvider>
            </AccountGate>
        </ManufacturerAccountProvider>
    );
}
