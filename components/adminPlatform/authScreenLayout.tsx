import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BlackLogo } from "@/components/mainWebsite/navigations/logo";
import AuthSidePanel from "./authSidePanel";

// ─────────────────────────────────────────────────────────────────────────────
// AuthScreenLayout — the admin login, sign-up and reset password screens: the
// photo panel on the left half from md up, and the form column beside it —
// "ADMIN", the title and description, then the form and a link to the other
// screen. On phones the panel gives way to the logo above the form; with
// `fillScreen`, the form stretches to the bottom of the screen so it can pin
// its button there (see the reset password form).
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthScreenLayout({
    title,
    description,
    footer,
    fillScreen = false,
    children,
}: {
    title: ReactNode;
    description: string;
    /** Under the form, e.g. "Don't have an account? Register". */
    footer?: ReactNode;
    /** Phones: let the form fill the rest of the screen, footer below it. */
    fillScreen?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-dvh bg-white">
            <AuthSidePanel />

            <div className="flex flex-1 flex-col px-4 pt-6 pb-10 sm:px-10 md:items-center md:pt-20">
                <div className="flex w-full flex-1 flex-col md:max-w-104 md:flex-none">
                    <div className="mb-11 w-32 md:hidden">
                        <BlackLogo />
                    </div>

                    <div className="mb-8 flex flex-col md:mb-12">
                        <span className="mb-4 text-xs font-medium font-text uppercase text-primary-700">
                            Admin
                        </span>
                        <h1 className="text-2xl md:text-[32px] font-bold font-text leading-tight tracking-tight text-mist-950">
                            {title}
                        </h1>
                        <p className="mt-2 text-sm md:text-lg font-text text-mist-500">{description}</p>
                    </div>

                    <div className={cn("flex flex-col", fillScreen && "flex-1 md:flex-none")}>
                        {children}
                    </div>

                    {footer && (
                        <p className="mt-10 text-center text-sm font-text text-mist-700 md:mt-14">
                            {footer}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
