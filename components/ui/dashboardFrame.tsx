import type { ReactNode } from "react";

/**
 * The dashboard's frame, the same on both platforms: the sidebar beside a
 * scrolling column of the top bars, the page, and the phone's bottom bar.
 * Pages sit on the light grey, with their cards in white. `beforeContent` goes
 * above the page, inside its padding (e.g. an account notice).
 */
export default function DashboardFrame({
    sidebar,
    desktopTopbar,
    mobileTopbar,
    bottomNav,
    beforeContent,
    children,
}: {
    sidebar: ReactNode;
    desktopTopbar: ReactNode;
    mobileTopbar: ReactNode;
    bottomNav: ReactNode;
    beforeContent?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex bg-mist-50">
            {sidebar}
            {/* `relative` makes this scroll area the containing block for absolutely
                positioned content inside it (e.g. sr-only text); without it they're
                placed against the page, poke out past the fold and scroll the page too */}
            <div className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                {desktopTopbar}
                {mobileTopbar}
                {/* pb-24 on phones clears the fixed bottom bar */}
                <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
                    {beforeContent}
                    {children}
                </main>
                {bottomNav}
            </div>
        </div>
    );
}
