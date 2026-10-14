import axios from "axios";
import { api } from "@/lib/api";
import type { SignatureResponse, UploadResult } from "@/lib/services/mediaService";

// ─────────────────────────────────────────────────────────────────────────────
// Machine booking: time on the machines at the MANDE factory in Lagos. Open to
// anyone (guests included); members on a plan with a machine discount get
// that % off. The maker asks for a date and start time and pays through the
// payment partner's checkout; staff then confirm the slot (optionally moving
// it) or cancel it (refunding in full when it was paid). All money is in whole
// kobo, and the API works out every price.
// ─────────────────────────────────────────────────────────────────────────────

export type MachineBookingService = "cut-and-shape" | "join-and-assemble" | "sand-and-finish";

export type MachineBookingStatus = "pending_payment" | "paid" | "confirmed" | "completed" | "cancelled";

/** What machine time is charged by: set by a super admin. */
export type MachineBookingUnit = "hour" | "day";

/** A machine on a booking: a snapshot, so later edits to the machine never change it. */
export type MachineBookingMachine = {
    machineId: string;
    name: string;
    model: string | null;
    category: string;
    type: string | null;
    /** Per unit, the price used for this booking. */
    priceKobo: number;
};

export type MachineBooking = {
    id: string;
    /** Human code, e.g. "MB-7K2Q9D". */
    code: string;
    status: MachineBookingStatus;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    /** The old service picker: null on bookings made with machines. */
    service: MachineBookingService | null;
    /** The machines booked, as they were at booking time. [] on bookings made before machines. */
    machines: MachineBookingMachine[];
    /** What they're making or cutting (1 to 1000 characters). */
    details: string;
    /** "YYYY-MM-DD" (a Lagos date). */
    date: string;
    /** "HH:mm", 24 hour clock. */
    startTime: string;
    /** A whole number of `unit`. */
    duration: number;
    unit: MachineBookingUnit;
    /** Per unit, as it was at booking time (the machines' prices added up, on machine bookings). */
    rateKobo: number;
    /** rateKobo x duration. */
    subtotalKobo: number;
    /** 0 for guests and plans without a machine discount. */
    discountPercent: number;
    discountKobo: number;
    /** What is charged: subtotal minus the discount. */
    amountKobo: number;
    /** The plan the discount came from. */
    planName: string | null;
    /** The coupon entered at booking, uppercase (kept even when the plan discount won). */
    couponCode: string | null;
    /** Which discount was applied (best one only, they never stack). */
    discountSource: "plan" | "coupon" | null;
    /** Set when a signed-in manufacturer booked it. */
    manufacturerId: string | null;
    /** `url` is a 5 minute signed link, only in the staff detail; null everywhere else. */
    idCard: { name: string | null; url: string | null };
    staffNote: string | null;
    cancelReason: string | null;
    refundStatus: null | "refunded" | "failed";
    paidAt: string | null;
    confirmedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
};

/** When the factory takes bookings: set by a super admin. Applies to new bookings and staff reschedules. */
export type MachineBookingSchedule = {
    /** 0 = Sunday ... 6 = Saturday. */
    openDays: number[];
    /** "HH:mm". */
    openTime: string;
    /** "HH:mm", after openTime. */
    closeTime: string;
    /** The start-time grid, counted from openTime. */
    slotMinutes: 15 | 30 | 60;
    /** "YYYY-MM-DD" (Lagos), e.g. holidays. */
    closedDates: string[];
    /** How far ahead a booking can be made, 1 to 365. */
    bookingWindowDays: number;
    /** How long before the start a booking must be made, 0 to 168. */
    minNoticeHours: number;
};

/** The defaults the API uses until a super admin sets the schedule. */
export const DEFAULT_MACHINE_BOOKING_SCHEDULE: MachineBookingSchedule = {
    openDays: [1, 2, 3, 4, 5, 6],
    openTime: "08:00",
    closeTime: "17:00",
    slotMinutes: 30,
    closedDates: [],
    bookingWindowDays: 90,
    minNoticeHours: 2,
};

export const WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** "Mon to Sat", "Mon, Wed, Fri": the open days, with runs of three or more joined. */
export function formatOpenDays(openDays: number[]): string {
    const days = [...new Set(openDays)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
    if (days.length === 0) return "No days";
    if (days.length === 7) return "Every day";
    const runs: number[][] = [];
    for (const d of days) {
        const last = runs[runs.length - 1];
        if (last && last[last.length - 1] === d - 1) last.push(d);
        else runs.push([d]);
    }
    return runs
        .map((run) =>
            run.length >= 3
                ? `${WEEKDAY_SHORT_LABELS[run[0]]} to ${WEEKDAY_SHORT_LABELS[run[run.length - 1]]}`
                : run.map((d) => WEEKDAY_SHORT_LABELS[d]).join(", "),
        )
        .join(", ");
}

export type MachineBookingPlanDiscount = { planId: string; planName: string; percent: number };

/** A machine that can be booked now (active and priced for the current unit). */
export type PublicMachine = {
    id: string;
    name: string;
    imageUrl: string | null;
    functions: string[];
    category: string;
    model: string | null;
    type: string | null;
    description: string | null;
    /** The price for the current unit. */
    priceKobo: number;
};

/** GET /machine-bookings/pricing. */
export type MachineBookingPricing = {
    unit: MachineBookingUnit;
    /** Kept by the API for old clients only: don't use it (prices live on the machines). */
    rateKobo: number;
    /** What can be booked, by sort order then name. Booking is closed when it's empty. */
    machines: PublicMachine[];
    /** The most machines one booking can have. */
    maxMachines: number;
    maxDuration: number;
    services: { value: MachineBookingService | string; label: string }[];
    /** Plans with a % off, highest last. */
    planDiscounts: MachineBookingPlanDiscount[];
    /** Null when not signed in as a manufacturer; 0 when signed in without a discount. */
    yourDiscountPercent: number | null;
    yourPlanName: string | null;
    /** When bookings can start. */
    schedule: MachineBookingSchedule;
};

/** The machine booking settings (super admins set them in Settings). */
export type MachineBookingSettings = {
    unit: MachineBookingUnit;
    /** No longer used for pricing (prices live on the machines); kept for old data. */
    rateKobo: number;
    /** 1 to 720. */
    maxDuration: number;
    /** 1 to 10. */
    maxMachinesPerBooking: number;
    schedule: MachineBookingSchedule;
};

/** The default for maxMachinesPerBooking until a super admin sets it. */
export const DEFAULT_MAX_MACHINES_PER_BOOKING = 3;

/** PATCH /settings/platform/machine-booking body: the whole schedule is always sent. */
export type UpdateMachineBookingSettingsPayload = Omit<MachineBookingSettings, "rateKobo">;

/** POST /machine-bookings/id-card/signature: a media signature plus the key the upload is tied to. */
export type IdCardSignatureResponse = SignatureResponse & { uploadKey: string };

/** A finished ID card upload: what POST /machine-bookings takes as `idCard`. */
export type IdCardUpload = UploadResult & { uploadKey: string };

export type CreateMachineBookingPayload = {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    /** The machines to book: 1 to maxMachines, unique. */
    machineIds: string[];
    details: string;
    date: string;
    startTime: string;
    duration: number;
    idCard: { publicId: string; uploadKey: string; name?: string };
    /** A coupon (best one only against the plan discount; the server decides). */
    couponCode?: string;
    /** A relative app path; the payment partner comes back to it with ?reference=. */
    returnPath?: string;
};

export type CreateMachineBookingResponse = {
    booking: MachineBooking;
    checkoutUrl: string;
    reference: string;
};

export type MachineBookingPage = { bookings: MachineBooking[]; nextBefore: string | null };

export type MachineBookingListParams = {
    status?: MachineBookingStatus;
    limit?: number;
    before?: string;
    /** Matches the code, name, email or phone. */
    q?: string;
};

/** POST /machine-bookings/lookup/verify: a short-lived token for GET /machine-bookings/lookup. */
export type MachineBookingLookupToken = { lookupToken: string; expiresInSeconds: number };

export type ConfirmMachineBookingPayload = {
    /** Set to move the slot. */
    date?: string;
    startTime?: string;
    note?: string;
};

/** The services, for labels where the pricing isn't loaded (e.g. staff tables). */
export const MACHINE_BOOKING_SERVICE_LABELS: Record<MachineBookingService, string> = {
    "cut-and-shape": "Cut and shape",
    "join-and-assemble": "Join and assemble",
    "sand-and-finish": "Sand and finish",
};

export const MACHINE_BOOKING_STATUS_LABELS: Record<MachineBookingStatus, string> = {
    pending_payment: "Awaiting payment",
    paid: "Paid",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
};

/** The StatusBadge tone for each status. */
export const MACHINE_BOOKING_STATUS_TONES: Record<MachineBookingStatus, "green" | "amber" | "red" | "gray" | "blue"> = {
    pending_payment: "amber",
    paid: "blue",
    confirmed: "green",
    completed: "gray",
    cancelled: "red",
};

/** Where the payment partner sends a booker back to (the website's return page). */
export const MACHINE_BOOKING_RETURN_PATH = "/machine-booking/complete";

/** "Cut and shape": the label for a service value, or the value itself when it's unknown. */
export function getMachineBookingServiceLabel(service: string): string {
    return MACHINE_BOOKING_SERVICE_LABELS[service as MachineBookingService] ?? service;
}

/** "Panel saw (Felder K 940)": a booked machine's name, with its model when it has one. */
export function formatBookedMachine(machine: Pick<MachineBookingMachine, "name" | "model">): string {
    return machine.model ? `${machine.name} (${machine.model})` : machine.name;
}

/**
 * What a booking is for: its machines, comma separated, or the old service's
 * label on bookings made before machines.
 */
export function describeBookingMachines(booking: Pick<MachineBooking, "machines" | "service">): string {
    const machines = booking.machines ?? [];
    if (machines.length > 0) return machines.map((machine) => machine.name).join(", ");
    return booking.service ? getMachineBookingServiceLabel(booking.service) : "No machines";
}

/** "3 hours", "1 day". */
export function formatMachineDuration(duration: number, unit: MachineBookingUnit): string {
    return `${duration} ${unit}${duration === 1 ? "" : "s"}`;
}

/**
 * "Coupon SAVE10", "20% plan discount": the discount a booking got, or null.
 * Bookings made before coupons existed have no discountSource: a plan one then.
 */
export function describeMachineBookingDiscount(
    booking: Pick<MachineBooking, "discountKobo" | "discountPercent" | "couponCode" | "discountSource" | "planName">,
): string | null {
    if (booking.discountKobo <= 0) return null;
    if (booking.discountSource === "coupon" && booking.couponCode) return `Coupon ${booking.couponCode}`;
    if (booking.discountPercent > 0) return `${booking.discountPercent}% plan discount`;
    return "Discount";
}

/** "Mon, 14 Oct 2026 at 09:30": a booking's date and start time, read as given (a Lagos date and time). */
export function formatMachineSlot(date: string, startTime: string): string {
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return `${date} at ${startTime}`;
    const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
    return `${label} at ${startTime}`;
}

export const machineBookingService = {
    // ── Public / maker ──────────────────────────────────────────────────────

    /** The rate, unit, services and plan discounts (with the signed-in manufacturer's own). */
    async getPricing(): Promise<MachineBookingPricing> {
        const { data } = await api.get<{ pricing: MachineBookingPricing }>("/machine-bookings/pricing");
        // An API without the schedule or machines yet answers with the documented defaults.
        return {
            ...data.pricing,
            schedule: data.pricing.schedule ?? DEFAULT_MACHINE_BOOKING_SCHEDULE,
            machines: data.pricing.machines ?? [],
            maxMachines: data.pricing.maxMachines ?? DEFAULT_MAX_MACHINES_PER_BOOKING,
        };
    },

    /** Signs an ID card upload to the booking's private folder. */
    async getIdCardSignature(signal?: AbortSignal): Promise<IdCardSignatureResponse> {
        const { data } = await api.post<IdCardSignatureResponse>("/machine-bookings/id-card/signature", {}, { signal });
        return data;
    },

    /**
     * Uploads an ID card (image or PDF) straight to Cloudinary, signed by the
     * API the same way mediaService.uploadFile does, and keeps the key the
     * upload is tied to.
     */
    async uploadIdCard(
        file: File,
        onProgress?: (percent: number) => void,
        signal?: AbortSignal,
    ): Promise<IdCardUpload> {
        const signature = await machineBookingService.getIdCardSignature(signal);
        const formData = new FormData();
        for (const [key, value] of Object.entries(signature.fields ?? {})) {
            formData.append(key, String(value));
        }
        formData.append("file", file);
        const { data } = await axios.post<{
            public_id: string;
            secure_url: string;
            format: string;
            bytes: number;
            resource_type: string;
        }>(signature.uploadUrl, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            signal,
            onUploadProgress: (event) => {
                if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
            },
        });
        return {
            publicId: data.public_id,
            url: data.secure_url,
            format: data.format,
            bytes: data.bytes,
            resourceType: data.resource_type,
            uploadKey: signature.uploadKey,
        };
    },

    /** Starts a booking: answers with the checkout to send the booker to. */
    async createBooking(payload: CreateMachineBookingPayload): Promise<CreateMachineBookingResponse> {
        const { data } = await api.post<CreateMachineBookingResponse>("/machine-bookings", payload);
        return data;
    },

    /** Checks the payment with the payment partner (after coming back from checkout). */
    async confirmPayment(reference: string): Promise<MachineBooking> {
        const { data } = await api.post<{ booking: MachineBooking }>(
            `/machine-bookings/payments/${encodeURIComponent(reference)}/confirm`,
        );
        return data.booking;
    },

    /** The signed-in manufacturer's bookings, newest first. */
    async getMyBookings(params: { limit?: number; before?: string } = {}): Promise<MachineBookingPage> {
        const { data } = await api.get<MachineBookingPage>("/machine-bookings/mine", { params });
        return data;
    },

    // ── Guests (no account) ─────────────────────────────────────────────────

    /** One booking from the private link in a booking email (no ID card link). */
    async getBookingByViewToken(token: string): Promise<MachineBooking> {
        const { data } = await api.get<{ booking: MachineBooking }>(
            `/machine-bookings/view/${encodeURIComponent(token)}`,
        );
        return data.booking;
    },

    /** Emails a 6 digit code when bookings exist for that email. Always answers the same message. */
    async sendLookupCode(email: string): Promise<{ message: string }> {
        const { data } = await api.post<{ message: string }>("/machine-bookings/lookup/code", { email });
        return data;
    },

    /** Swaps the emailed code for a short-lived lookup token. */
    async verifyLookupCode(email: string, code: string): Promise<MachineBookingLookupToken> {
        const { data } = await api.post<MachineBookingLookupToken>("/machine-bookings/lookup/verify", { email, code });
        return data;
    },

    /** Every booking for the verified email, newest first (no ID card links). */
    async getLookupBookings(lookupToken: string): Promise<MachineBooking[]> {
        const { data } = await api.get<{ bookings: MachineBooking[] }>("/machine-bookings/lookup", {
            headers: { "X-Lookup-Token": lookupToken },
        });
        return data.bookings;
    },

    // ── Staff (admin and super admin) ───────────────────────────────────────

    async listBookings(params: MachineBookingListParams = {}): Promise<MachineBookingPage> {
        const { data } = await api.get<MachineBookingPage>("/machine-bookings", { params });
        return data;
    },

    /** One booking, with a 5 minute signed link to the ID card. */
    async getBooking(id: string): Promise<MachineBooking> {
        const { data } = await api.get<{ booking: MachineBooking }>(`/machine-bookings/${encodeURIComponent(id)}`);
        return data.booking;
    },

    /** Confirms a paid booking's slot, optionally moving it. Emails the booker. */
    async confirmBooking(id: string, payload: ConfirmMachineBookingPayload = {}): Promise<MachineBooking> {
        const { data } = await api.post<{ booking: MachineBooking }>(
            `/machine-bookings/${encodeURIComponent(id)}/confirm`,
            payload,
        );
        return data.booking;
    },

    /** Marks a confirmed booking as done. */
    async completeBooking(id: string): Promise<MachineBooking> {
        const { data } = await api.post<{ booking: MachineBooking }>(`/machine-bookings/${encodeURIComponent(id)}/complete`);
        return data.booking;
    },

    /** Cancels a booking, refunding it in full when it was paid. Emails the booker. */
    async cancelBooking(id: string, reason: string): Promise<MachineBooking> {
        const { data } = await api.post<{ booking: MachineBooking }>(`/machine-bookings/${encodeURIComponent(id)}/cancel`, {
            reason,
        });
        return data.booking;
    },

    // ── Settings ────────────────────────────────────────────────────────────

    /** The machine booking settings, from GET /settings/platform (admins and super admins). */
    async getSettings(): Promise<MachineBookingSettings | null> {
        const { data } = await api.get<{
            settings?: { machineBooking?: MachineBookingSettings };
            machineBooking?: MachineBookingSettings;
        }>("/settings/platform");
        const settings = data.settings?.machineBooking ?? data.machineBooking ?? null;
        if (!settings) return null;
        return {
            ...settings,
            schedule: settings.schedule ?? DEFAULT_MACHINE_BOOKING_SCHEDULE,
            maxMachinesPerBooking: settings.maxMachinesPerBooking ?? DEFAULT_MAX_MACHINES_PER_BOOKING,
        };
    },

    /** Sets the unit, longest booking, machines per booking and schedule (super admins). */
    async updateMachineBookingSettings(settings: UpdateMachineBookingSettingsPayload): Promise<MachineBookingSettings> {
        const { data } = await api.patch<{ machineBooking: MachineBookingSettings }>(
            "/settings/platform/machine-booking",
            settings,
        );
        return data.machineBooking;
    },
};
