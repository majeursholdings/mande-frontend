import { BlackLogo } from "@/components/mainWebsite/navigations/logo";
import NavLinks from "./navLinks";

/** The desktop nav — from lg up; phones use the bottom bar and its Menu drawer. */
export default function DashboardSidebar() {
    return (
        <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-12 border-r border-border bg-white pt-10 pb-24 lg:flex">
            <div className="px-10">
                <div className="max-w-30">
                    <BlackLogo />
                </div>
            </div>
            <NavLinks />
        </aside>
    );
}
