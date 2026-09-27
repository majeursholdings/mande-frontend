import SharedSidebar from "@/components/ui/dashboardSidebar";
import NavLinks from "./navLinks";

/** The desktop nav — from lg up; phones use the bottom bar and its Menu drawer. */
export default function DashboardSidebar() {
    return (
        <SharedSidebar>
            <NavLinks />
        </SharedSidebar>
    );
}
