import { ReactNode } from "react";
import DashboardFrame from "@/components/ui/dashboardFrame";
import DashboardSidebar from "./sidebar";
import DesktopTopbar from "./desktopTopbar";
import MobileTopbar from "./mobileTopbar";
import MobileBottomNav from "./mobileBottomNav";
import AccountGate from "./accountGate";
import AccountStatusBanner from "./accountStatusBanner";
import BusinessDocumentsGate from "./businessDocumentsGate";
import SignUpGate from "./signUpGate";
import { ManufacturerAccountProvider } from "./manufacturerAccountContext";
import { ManufacturerProfileProvider } from "./manufacturerProfileContext";
import { ManufacturerSubscriptionProvider } from "./manufacturerSubscriptionContext";
import { JobApplicationsProvider } from "./jobApplicationsContext";
import { ManufacturerWalletProvider } from "./manufacturerWalletContext";
import { NotificationsProvider } from "./notificationsContext";
import { RecentSearchesProvider } from "./recentSearchesContext";
import { LeadReviewsProvider } from "./leadReviewsContext";
import LeadReviewPrompt from "./leadReviewPrompt";
import SessionGuard from "./sessionGuard";
import { ManufacturerLogoutProvider } from "./logoutContext";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";

export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <SessionGuard role="manufacturer" loginUrl={ARTISAN_LOGIN_URL}>
            <ManufacturerLogoutProvider>
                <ManufacturerAccountProvider>
            {/* Suspended: only the appeal screen, in place of the whole dashboard */}
            <AccountGate>
                <ManufacturerProfileProvider>
                    <ManufacturerWalletProvider>
                        <ManufacturerSubscriptionProvider>
                            {/* Sign-up not finished (plan unpaid, company details missing): only those steps */}
                            <SignUpGate>
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
                            </SignUpGate>
                        </ManufacturerSubscriptionProvider>
                    </ManufacturerWalletProvider>
                </ManufacturerProfileProvider>
            </AccountGate>
        </ManufacturerAccountProvider>
            </ManufacturerLogoutProvider>
        </SessionGuard>
    );
}
