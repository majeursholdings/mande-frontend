// ─────────────────────────────────────────────────────────────────────────────
// Cookie consent: what a visitor has allowed beyond the essential cookies, and
// the bridge to Google Tag Manager, which loads every analytics and
// advertising tool (Google Analytics, Meta Pixel, TikTok Pixel). Nothing from
// Tag Manager loads until the visitor allows something, and Google's Consent
// Mode is told exactly what they allowed, so each tag in the container only
// fires for its own category. See docs/analytics-and-consent.md for setting
// up the container. Matches the Cookie policy (/legals/cookie-policy): keep
// the two in step when a tool or cookie is added.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Tag Manager container ("GTM-XXXXXXX"). Without one, there's nothing to ask about and no banner shows.
 * Production builds only, so `next dev` is never tracked even with the ID in .env.local.
 */
export const GTM_ID = process.env.NODE_ENV === "production" ? (process.env.NEXT_PUBLIC_GTM_ID ?? "") : "";

/** Remembers the visitor's choices; listed in the Cookie policy as "Cookie choices". */
const CONSENT_COOKIE = "mande_consent";
/** Raise it when the categories change, so everyone is asked again. */
const CONSENT_VERSION = 1;
/** 12 months, as the Cookie policy says. */
const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** The optional categories. Essential cookies are always on and aren't a choice. */
export type ConsentChoices = { analytics: boolean; advertising: boolean };
type StoredConsent = ConsentChoices & { v: number; at: string };

export const ALL_ALLOWED: ConsentChoices = { analytics: true, advertising: true };
export const NONE_ALLOWED: ConsentChoices = { analytics: false, advertising: false };

/** The cookies each category's tools set on our domain, cleared when it's switched off. */
const CATEGORY_COOKIES: Record<keyof ConsentChoices, RegExp[]> = {
    analytics: [/^_ga$/, /^_ga_/, /^_gid$/],
    advertising: [/^_fbp$/, /^_fbc$/, /^_ttp$/, /^_tt_enable_cookie$/, /^_gcl_/],
};

declare global {
    interface Window {
        dataLayer?: unknown[];
    }
}

/** The visitor's saved choices, or null when they haven't chosen yet (or chose under an older version). */
export function readConsent(): ConsentChoices | null {
    if (typeof document === "undefined") return null;
    const raw = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
        ?.slice(CONSENT_COOKIE.length + 1);
    if (!raw) return null;
    try {
        const stored = JSON.parse(decodeURIComponent(raw)) as Partial<StoredConsent>;
        if (stored.v !== CONSENT_VERSION) return null;
        return { analytics: stored.analytics === true, advertising: stored.advertising === true };
    } catch {
        return null;
    }
}

export function saveConsent(choices: ConsentChoices) {
    const stored: StoredConsent = { ...choices, v: CONSENT_VERSION, at: new Date().toISOString() };
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(stored))}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export const allowsAnything = (choices: ConsentChoices | null) => !!choices && (choices.analytics || choices.advertising);

/** Categories that were allowed before and aren't now: their tools must stop. */
export function withdrawnCategories(before: ConsentChoices | null, after: ConsentChoices): (keyof ConsentChoices)[] {
    if (!before) return [];
    return (Object.keys(after) as (keyof ConsentChoices)[]).filter((category) => before[category] && !after[category]);
}

/** Deletes the cookies a category's tools set, on this host and on the parent domain they may have used. */
export function clearCategoryCookies(category: keyof ConsentChoices) {
    const names = document.cookie
        .split("; ")
        .map((cookie) => cookie.split("=")[0] ?? "")
        .filter((name) => CATEGORY_COOKIES[category].some((pattern) => pattern.test(name)));
    const hostParts = window.location.hostname.split(".");
    const domains = ["", ...hostParts.slice(0, -1).map((_, index) => `; Domain=.${hostParts.slice(index).join(".")}`)];
    for (const name of names) {
        for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
}

/** Google's gtag(), which Tag Manager reads from the dataLayer. It must push the arguments object itself. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- typed for callers; the body reads `arguments`
function gtag(..._args: unknown[]) {
    window.dataLayer = window.dataLayer ?? [];
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
}

/** The visitor's choices in Consent Mode's terms. Advertising covers ads storage and ads use of their data. */
function toGoogleConsent(choices: ConsentChoices) {
    const state = (allowed: boolean) => (allowed ? "granted" : "denied");
    return {
        analytics_storage: state(choices.analytics),
        ad_storage: state(choices.advertising),
        ad_user_data: state(choices.advertising),
        ad_personalization: state(choices.advertising),
    };
}

/** Whether Tag Manager has been started on this page (the init script marks the dataLayer). */
const tagManagerStarted = () =>
    !!window.dataLayer?.some((entry) => !!entry && typeof entry === "object" && "gtm.start" in (entry as object));

// ─── The visitor's choices, as a store React reads with useSyncExternalStore ───

/** Their choices, null when they haven't chosen, undefined until the cookie has been read. */
let snapshot: ConsentChoices | null | undefined;
const listeners = new Set<() => void>();

export function subscribeToConsent(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** The saved choices, read from the cookie once and cached (useSyncExternalStore needs the same object each time). */
export function getConsentSnapshot(): ConsentChoices | null {
    if (snapshot === undefined) snapshot = readConsent();
    return snapshot;
}

/** The server can't see the cookie: "not known yet", so nothing about consent renders until the browser takes over. */
export const getServerConsentSnapshot = (): ConsentChoices | null | undefined => undefined;

/**
 * Saves new choices, from a click on the banner or in Cookie settings. If
 * Tag Manager is running, Consent Mode is updated straight away. Switching a
 * category off also clears its cookies and reloads the page, because a tool
 * that's already running can't be unloaded.
 */
export function updateConsent(next: ConsentChoices) {
    const withdrawn = withdrawnCategories(getConsentSnapshot(), next);
    saveConsent(next);
    if (tagManagerStarted()) {
        gtag("consent", "update", toGoogleConsent(next));
        window.dataLayer?.push({ event: "consent_updated" });
    }
    if (withdrawn.length > 0) {
        withdrawn.forEach(clearCategoryCookies);
        window.location.reload();
        return;
    }
    snapshot = next;
    listeners.forEach((listener) => listener());
}

/**
 * The script that starts Tag Manager, run once the visitor has allowed
 * something. In one go, so the order is guaranteed: Consent Mode's defaults
 * (everything denied), the visitor's choices, Tag Manager's start, then any
 * events recorded before it ran, and only then the container itself.
 */
export function tagManagerInitScript(choices: ConsentChoices): string {
    const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
    const defaults = { ...toGoogleConsent(NONE_ALLOWED), security_storage: "granted", functionality_storage: "granted" };
    return `(function (w, d, id, defaults, choices) {
  var earlier = w.dataLayer || [];
  w.dataLayer = [];
  function gtag() { w.dataLayer.push(arguments); }
  gtag("consent", "default", defaults);
  gtag("consent", "update", choices);
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  for (var i = 0; i < earlier.length; i++) w.dataLayer.push(earlier[i]);
  var script = d.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
  d.head.appendChild(script);
})(window, document, ${json(GTM_ID)}, ${json(defaults)}, ${json(toGoogleConsent(choices))});`;
}
