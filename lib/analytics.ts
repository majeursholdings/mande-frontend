// ─────────────────────────────────────────────────────────────────────────────
// The events the website sends to Google Tag Manager, which turns them into
// GA4 events, ad conversions and retargeting audiences. Every event waits for
// the visitor's cookie consent (see lib/consent.ts), and none carries anything
// personal: no names, emails, phone numbers or typed messages. The names
// follow GA4's recommended events where one exists, so GA4 reports revenue and
// key events without extra setup. docs/analytics-and-consent.md lists them all
// with the container's tags; keep the two in step.
// ─────────────────────────────────────────────────────────────────────────────

import { GTM_ID, allowsAnything, getConsentSnapshot } from "@/lib/consent";
import type { SubscriptionPayment } from "@/lib/services/subscriptionService";
import type { MachineBooking } from "@/lib/services/machineBookingService";

/** The forms whose interactions are tracked (form_start, form_submit, form_error). */
export type TrackedFormName = "contact" | "support_feedback" | "machine_booking" | "manufacturer_sign_up";

/** What was paid for: a plan at sign-up, or machine time. */
type PurchaseType = "plan" | "machine_booking";

/** One line of a GA4 ecommerce event. */
type EcommerceItem = {
    item_id: string;
    item_name: string;
    item_category: string;
    item_variant?: string;
    price: number;
    quantity: number;
};

type Ecommerce = { currency: "NGN"; value?: number; coupon?: string; items: EcommerceItem[] };

type VideoEvent = {
    video_title: string;
    video_url: string;
    video_percent: number;
    video_duration: number;
    video_provider: "mande";
};

export type TrackedEvent =
    | { event: "sign_up"; method: "email"; user_type: "manufacturer" }
    | { event: "begin_checkout"; checkout_type: PurchaseType; ecommerce: Ecommerce }
    | { event: "purchase"; purchase_type: PurchaseType; ecommerce: Ecommerce & { transaction_id: string; value: number } }
    | { event: "generate_lead"; form_name: TrackedFormName; topic: string }
    | { event: "form_start" | "form_submit" | "form_error"; form_name: TrackedFormName }
    | ({ event: "video_start" | "video_progress" | "video_complete" } & VideoEvent)
    | { event: "cta_click"; cta_text: string; link_url: string; cta_location: string }
    | { event: "contact_click"; contact_method: "whatsapp" | "email" | "phone"; cta_location: string };

/**
 * Records an event for Tag Manager, only once the visitor has allowed
 * analytics or advertising. If Tag Manager hasn't started yet, its init
 * script puts the event after Consent Mode's defaults.
 */
export function trackEvent(event: TrackedEvent) {
    if (typeof window === "undefined" || !GTM_ID || !allowsAnything(getConsentSnapshot())) return;
    window.dataLayer = window.dataLayer ?? [];
    // GA4 asks for the last ecommerce object to be cleared first, so items never carry over
    if ("ecommerce" in event) window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push(event);
}

const naira = (kobo: number) => Math.round(kobo) / 100;

// ─── Payments ───

function planItem(planId: string, billingCycle: string, price = 0): EcommerceItem {
    return { item_id: planId, item_name: `${planId} plan`, item_category: "plan", item_variant: billingCycle, price, quantity: 1 };
}

/** Leaving for the plan checkout at sign-up. The price is only known once it's paid. */
export function trackPlanCheckout(planId: string, billingCycle: string) {
    trackEvent({ event: "begin_checkout", checkout_type: "plan", ecommerce: { currency: "NGN", items: [planItem(planId, billingCycle)] } });
}

/** A plan paid for at sign-up, with what was actually charged. */
export function trackPlanPurchase(payment: SubscriptionPayment) {
    const value = naira(payment.amountKobo);
    trackEvent({
        event: "purchase",
        purchase_type: "plan",
        ecommerce: {
            transaction_id: payment.reference,
            value,
            currency: "NGN",
            ...(payment.couponCode ? { coupon: payment.couponCode } : {}),
            items: [planItem(payment.planId, payment.billingCycle, value)],
        },
    });
}

/** Each machine as a line, its price per unit and the units booked. */
function bookingEcommerce(booking: MachineBooking): Ecommerce & { value: number } {
    return {
        currency: "NGN",
        value: naira(booking.amountKobo),
        ...(booking.discountSource === "coupon" && booking.couponCode ? { coupon: booking.couponCode } : {}),
        items: booking.machines.map((machine) => ({
            item_id: machine.machineId,
            item_name: machine.name,
            item_category: machine.category,
            item_variant: booking.unit,
            price: naira(machine.priceKobo),
            quantity: booking.duration,
        })),
    };
}

export function trackMachineBookingCheckout(booking: MachineBooking) {
    trackEvent({ event: "begin_checkout", checkout_type: "machine_booking", ecommerce: bookingEcommerce(booking) });
}

export function trackMachineBookingPurchase(booking: MachineBooking) {
    trackEvent({ event: "purchase", purchase_type: "machine_booking", ecommerce: { ...bookingEcommerce(booking), transaction_id: booking.code } });
}

// ─── Videos ───

/** The share of a video passed on the way to the end, reported once each as video_progress. */
export const VIDEO_PROGRESS_MILESTONES = [25, 50, 75] as const;

/** A readable name from the file, e.g. "mande-film-web-3x2" for ".../mande-film-web-3x2.mp4". */
export const videoTitleFromSrc = (src: string) => decodeURIComponent(src.split("?")[0]?.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? src);

export function trackVideo(event: "video_start" | "video_progress" | "video_complete", video: HTMLVideoElement, title: string, percent: number) {
    trackEvent({
        event,
        video_title: title,
        video_url: video.currentSrc || video.src,
        video_percent: percent,
        video_duration: Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
        video_provider: "mande",
    });
}

// ─── Button and link clicks ───

/** Dashboards are left out: their buttons can hold people's names, amounts and job details. */
const UNTRACKED_CLICK_PATHS = ["/admin", "/super-admin", "/manufacturer"];
/** The sign-up and login pages are part of the funnel, so their buttons are tracked. */
const TRACKED_DASHBOARD_PATHS = ["/manufacturer/registration", "/manufacturer/login"];

function contactMethod(href: string): "whatsapp" | "email" | "phone" | null {
    if (href.startsWith("mailto:")) return "email";
    if (href.startsWith("tel:")) return "phone";
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//.test(href)) return "whatsapp";
    return null;
}

/** A button's words, without anything that looks like an email address or a phone number. */
const clickLabel = (element: Element) =>
    (element.getAttribute("data-track-name") ?? element.getAttribute("aria-label") ?? element.textContent ?? "")
        .replace(/\S+@\S+/g, "")
        .replace(/\+?\d[\d\s-]{6,}\d/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

/**
 * Every button and link clicked on the website, as cta_click (with its
 * words and where it goes), or contact_click for WhatsApp, email and phone
 * links. Leave an element out with data-track="off"; name it with
 * data-track-name when its words aren't clear on their own.
 */
function onDocumentClick(event: MouseEvent) {
    const element = event.target instanceof Element ? event.target.closest("a[href], button") : null;
    if (!element || element.closest('[data-track="off"]')) return;
    const path = window.location.pathname;
    const untracked =
        UNTRACKED_CLICK_PATHS.some((prefix) => path.startsWith(prefix)) && !TRACKED_DASHBOARD_PATHS.some((prefix) => path.startsWith(prefix));
    if (untracked) return;

    const href = element instanceof HTMLAnchorElement ? element.href : "";
    const contact = contactMethod(href);
    if (contact) {
        trackEvent({ event: "contact_click", contact_method: contact, cta_location: path });
        return;
    }
    const label = clickLabel(element);
    if (label) trackEvent({ event: "cta_click", cta_text: label, link_url: href, cta_location: path });
}

let clickTrackingInstalled = false;

/** Listens for clicks once per page load. Events still only go out with consent (trackEvent checks). */
export function installClickTracking() {
    if (clickTrackingInstalled || typeof document === "undefined") return;
    clickTrackingInstalled = true;
    document.addEventListener("click", onDocumentClick, true);
}
