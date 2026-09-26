"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SocialLoginProvider } from "@/constant/manufacturer";
import { FacebookIcon, GoogleIcon, type SocialIconProps } from "../socialIcons";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";

const PROVIDERS: {
    provider: SocialLoginProvider;
    name: string;
    Icon: (props: SocialIconProps) => React.JSX.Element;
}[] = [
    { provider: "google", name: "Google", Icon: GoogleIcon },
    { provider: "facebook", name: "Facebook", Icon: FacebookIcon },
];

/** Google / Facebook accounts linked to the profile for one-click login. */
export default function LinkedAccounts() {
    const { profile, updateSecurity } = useManufacturerProfile();
    const [pending, setPending] = useState<SocialLoginProvider | null>(null);
    const { linkedAccounts } = profile.security;

    const toggleLink = async (provider: SocialLoginProvider, name: string) => {
        const isLinked = !!linkedAccounts[provider];
        setPending(provider);
        try {
            // No backend is wired up yet — linking will go through the
            // provider's sign-in (OAuth) popup. Simulate it for now, linking
            // the manufacturer's own email.
            await new Promise((resolve) => setTimeout(resolve, 800));
            updateSecurity((security) => ({
                ...security,
                linkedAccounts: {
                    ...security.linkedAccounts,
                    [provider]: isLinked ? null : profile.email,
                },
            }));
            toast.success(isLinked ? `${name} account unlinked` : `${name} account linked`);
        } catch {
            toast.error(
                `Couldn't ${isLinked ? "unlink" : "link"} your ${name} account. Please try again.`,
            );
        } finally {
            setPending(null);
        }
    };

    return (
        <ul className="flex flex-col gap-3">
            {PROVIDERS.map(({ provider, name, Icon }) => {
                const linkedTo = linkedAccounts[provider];
                const isPending = pending === provider;

                return (
                    <li
                        key={provider}
                        className="flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-3.5"
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mist-50">
                            <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium font-text text-mist-950">{name}</p>
                            <p className="truncate text-xs font-text text-mist-500">
                                {linkedTo ? `Linked to ${linkedTo}` : "Not linked"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleLink(provider, name)}
                            disabled={pending !== null}
                            className={cn(
                                "flex h-9 shrink-0 items-center gap-2 rounded-button border px-4 text-sm font-medium font-text transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                                linkedTo
                                    ? "border-border text-mist-700 enabled:hover:bg-mist-50"
                                    : "border-secondary-700 text-secondary-700 enabled:hover:bg-secondary-50",
                            )}
                        >
                            {isPending && <Loader2 className="size-3.5 animate-spin" />}
                            {linkedTo ? "Unlink" : "Link"}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
