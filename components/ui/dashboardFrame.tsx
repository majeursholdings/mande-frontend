import type { ReactNode } from "react";

/**
 * The dashboard's frame, the same on every platform: the sidebar beside a
 * column of the top bars, the page, and the phone's bottom bar. The page
 * itself is the only thing that scrolls (the sidebar and top bars stay put):
 * a second scroll area inside it could be nudged on its own, by a dialog or
 * focus below the fold, and shift the whole page down.
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
        <div className="flex min-h-dvh bg-mist-50">
            {sidebar}
            {/* `relative` keeps absolutely positioned content (e.g. sr-only text)
                inside the column; `overflow-x-clip` cuts off anything too wide
                without making a scroll area, so the sticky top bars still stick */}
            <div className="relative flex min-w-0 flex-1 flex-col overflow-x-clip">
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
