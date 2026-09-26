import { ReactNode } from "react";
import AuthSidePanel, { AuthSidePanelProps } from "./authSidePanel";

export type AuthScreenLayoutProps = AuthSidePanelProps & {
    children: ReactNode;
};

export default function AuthScreenLayout({
    children,
    ...sidePanelProps
}: AuthScreenLayoutProps) {
    return (
        <div className="flex min-h-screen bg-white">
            <AuthSidePanel {...sidePanelProps} />
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12 sm:px-10">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
