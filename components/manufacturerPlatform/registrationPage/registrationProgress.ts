import type { RegistrationFormValues } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Saved sign-up progress. The account exists on the API once step 1 (name,
// email, phone, password) is done; from then on each finished step is saved
// here, in the browser's localStorage, so someone who drops off (or leaves
// for the payment partner's checkout) comes back to the step they'd reached.
// Passwords, codes, the NIN and uploaded files are never saved.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "mande:manufacturer-registration";

const NEVER_SAVED: readonly string[] = ["password", "otp", "ninNumber", "ninCard"] satisfies (keyof RegistrationFormValues)[];

export type RegistrationProgress = {
    /** The step to resume at (0-based). */
    stepIndex: number;
    values: Partial<RegistrationFormValues>;
    /** Set once the plan is paid for, so it isn't charged again. */
    paymentReference: string | null;
};

/** The saved progress as stored — a stable string, for useSyncExternalStore. Browser only. */
export function readSavedRegistration(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function parseRegistrationProgress(raw: string | null): RegistrationProgress | null {
    if (!raw) return null;
    try {
        const progress = JSON.parse(raw) as RegistrationProgress;
        return typeof progress?.stepIndex === "number" ? progress : null;
    } catch {
        return null;
    }
}

export function loadRegistrationProgress(): RegistrationProgress | null {
    return parseRegistrationProgress(readSavedRegistration());
}

export function saveRegistrationProgress(
    stepIndex: number,
    values: RegistrationFormValues,
    paymentReference: string | null,
): void {
    const savable = Object.fromEntries(
        Object.entries(values).filter(([key]) => !NEVER_SAVED.includes(key)),
    );
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ stepIndex, values: savable, paymentReference }),
        );
    } catch {
        // Storage unavailable (e.g. private browsing) — sign-up still works,
        // it just can't be resumed later
    }
}

export function clearRegistrationProgress(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to clear
    }
}
