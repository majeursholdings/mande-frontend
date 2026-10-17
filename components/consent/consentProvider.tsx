"use client";

import { createContext, useCallback, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "@/components/mainWebsite/common/buttonStyles";
import { COOKIE_POLICY_URL } from "@/constant/navigation";
import {
    ALL_ALLOWED,
    GTM_ID,
    NONE_ALLOWED,
    allowsAnything,
    getConsentSnapshot,
    getServerConsentSnapshot,
    subscribeToConsent,
    tagManagerInitScript,
    updateConsent,
    type ConsentChoices,
} from "@/lib/consent";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Asks visitors which cookies they allow, and loads Google Tag Manager only
// once they've allowed analytics or advertising. Reject is as easy as accept,
// and nothing optional runs before a choice. "Cookie settings" in the footer
// reopens the choices; switching a category off clears its cookies and
// reloads the page, so its tools stop at once. Staff dashboards never load
// any of it. With no container set (NEXT_PUBLIC_GTM_ID), there's nothing to
// ask about, so nothing shows.
// ─────────────────────────────────────────────────────────────────────────────

/** Staff dashboards: no marketing tools, so no banner. */
const STAFF_PATH_PREFIXES = ["/admin", "/super-admin"];

type ConsentContextValue = {
    /** Whether the site asks about cookies at all (a container is set and this isn't a staff page). */
    enabled: boolean;
    openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue>({ enabled: false, openSettings: () => {} });

export const useCookieConsent = () => useContext(ConsentContext);

export function ConsentProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const enabled = !!GTM_ID && !STAFF_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

    // undefined until the browser has read the cookie, so the banner never flashes for people who've chosen
    const choices = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerConsentSnapshot);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const choose = useCallback((next: ConsentChoices) => {
        setSettingsOpen(false);
        updateConsent(next);
    }, []);

    const openSettings = useCallback(() => setSettingsOpen(true), []);

    return (
        <ConsentContext.Provider value={{ enabled, openSettings }}>
            {children}
            {/* Consent Mode first, then the container, in one script: nothing runs before it knows what's allowed */}
            {enabled && choices && allowsAnything(choices) && (
                <Script id="google-tag-manager" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: tagManagerInitScript(choices) }} />
            )}
            {enabled && choices === null && !settingsOpen && (
                <ConsentBanner onAcceptAll={() => choose(ALL_ALLOWED)} onRejectAll={() => choose(NONE_ALLOWED)} onChoose={openSettings} />
            )}
            {enabled && (
                <CookieSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} saved={choices ?? NONE_ALLOWED} onSave={choose} />
            )}
        </ConsentContext.Provider>
    );
}

/** The first-visit question, along the bottom of the page. Accept and reject look the same, on purpose. */
function ConsentBanner({ onAcceptAll, onRejectAll, onChoose }: { onAcceptAll: () => void; onRejectAll: () => void; onChoose: () => void }) {
    return (
        <section aria-label="Cookie choices" className="fixed inset-x-0 bottom-0 z-50 p-3 md:p-5">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-xl border border-border bg-white p-5 font-text shadow-xl md:flex-row md:items-center md:gap-8 md:p-6">
                <div className="flex flex-1 flex-col gap-1.5">
                    <h2 className="text-base font-medium text-mist-950">Cookies on MANDE</h2>
                    <p className="text-sm font-light text-mist-700">
                        We use essential cookies to keep the website working. With your permission, we&apos;d also like to use
                        analytics cookies to improve it, and advertising cookies to measure our adverts on Google, Facebook,
                        Instagram and TikTok.{" "}
                        <Link href={COOKIE_POLICY_URL} className="font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950">
                            Read our Cookie policy
                        </Link>
                    </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <button type="button" onClick={onAcceptAll} className={cn(WEBSITE_PRIMARY_BUTTON, "w-full cursor-pointer text-sm sm:w-auto")}>
                        Accept all
                    </button>
                    <button type="button" onClick={onRejectAll} className={cn(WEBSITE_PRIMARY_BUTTON, "w-full cursor-pointer text-sm sm:w-auto")}>
                        Reject all
                    </button>
                    <button
                        type="button"
                        onClick={onChoose}
                        className="cursor-pointer px-2 py-1.5 text-sm font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950"
                    >
                        Choose cookies
                    </button>
                </div>
            </div>
        </section>
    );
}

const CATEGORIES: { key: keyof ConsentChoices; title: string; description: string }[] = [
    {
        key: "analytics",
        title: "Analytics",
        description: "Google Analytics: how many people visit, which pages they use and where they came from, so we can improve the website.",
    },
    {
        key: "advertising",
        title: "Advertising",
        description:
            "Meta Pixel and TikTok Pixel, and Google's ad measurement: whether our adverts lead to visits, sign-ups and bookings, and showing them to people likely to be interested.",
    },
];

/** Every category with its own switch, from the banner's "Choose cookies" or the footer's "Cookie settings". */
function CookieSettingsDialog({
    open,
    onOpenChange,
    saved,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saved: ConsentChoices;
    onSave: (choices: ConsentChoices) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg gap-5">
                {/* Mounted afresh each time the dialog opens, so its switches start from what's saved */}
                <CookieSettingsForm saved={saved} onSave={onSave} />
            </DialogContent>
        </Dialog>
    );
}

function CookieSettingsForm({ saved, onSave }: { saved: ConsentChoices; onSave: (choices: ConsentChoices) => void }) {
    const [draft, setDraft] = useState(saved);
    const baseId = useId();

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <DialogTitle>Cookie settings</DialogTitle>
                <DialogDescription>
                    Choose which cookies MANDE can use. You can change this at any time from &ldquo;Cookie settings&rdquo; at the
                    bottom of every page.{" "}
                    <Link href={COOKIE_POLICY_URL} className="font-medium text-primary-800 underline underline-offset-4">
                        Cookie policy
                    </Link>
                </DialogDescription>
            </div>

            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                <li className="flex items-start justify-between gap-4 p-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-mist-950">Essential</p>
                        <p className="text-sm font-light text-mist-600">
                            Keep you signed in, remember these choices and protect the website. They can&apos;t be turned off.
                        </p>
                    </div>
                    <span className="shrink-0 pt-0.5 text-xs font-medium text-mist-500">Always on</span>
                </li>
                {CATEGORIES.map((category) => {
                    const labelId = `${baseId}-${category.key}`;
                    return (
                        <li key={category.key} className="flex items-start justify-between gap-4 p-4">
                            <div className="flex flex-col gap-1">
                                <p id={labelId} className="text-sm font-medium text-mist-950">
                                    {category.title}
                                </p>
                                <p className="text-sm font-light text-mist-600">{category.description}</p>
                            </div>
                            <Switch
                                aria-labelledby={labelId}
                                checked={draft[category.key]}
                                onCheckedChange={(checked) => setDraft((current) => ({ ...current, [category.key]: checked }))}
                                className="mt-0.5"
                            />
                        </li>
                    );
                })}
            </ul>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => onSave(NONE_ALLOWED)} className={cn(WEBSITE_OUTLINE_BUTTON, "w-full cursor-pointer text-sm sm:w-auto")}>
                    Reject all
                </button>
                <button type="button" onClick={() => onSave(ALL_ALLOWED)} className={cn(WEBSITE_OUTLINE_BUTTON, "w-full cursor-pointer text-sm sm:w-auto")}>
                    Accept all
                </button>
                <button type="button" onClick={() => onSave(draft)} className={cn(WEBSITE_PRIMARY_BUTTON, "w-full cursor-pointer text-sm sm:w-auto")}>
                    Save my choices
                </button>
            </div>
        </>
    );
}

/** "Cookie settings" for the footer's legal links; nothing when the site doesn't ask about cookies. */
export function CookieSettingsButton({ className, asListItem = false }: { className?: string; asListItem?: boolean }) {
    const { enabled, openSettings } = useCookieConsent();
    if (!enabled) return null;
    const button = (
        <button type="button" onClick={openSettings} className={cn("cursor-pointer", className)}>
            Cookie settings
        </button>
    );
    return asListItem ? <li>{button}</li> : button;
}
