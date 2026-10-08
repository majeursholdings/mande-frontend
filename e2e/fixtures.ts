import { test as base, expect, type Page, type Request } from "@playwright/test";
import { API_URL, APP_URL } from "../playwright.config";

// ─────────────────────────────────────────────────────────────────────────────
// What every admin test shares: uploads never reach Cloudinary (the browser's
// upload is answered here with a made-up file), and the people the seed made.
// ─────────────────────────────────────────────────────────────────────────────

/** From the backend's seed (src/scripts/seed.ts). */
export const SEEDED = {
    password: "Password123!",
    lead: { email: "latade@mande.com.ng", name: "Latade Dipe" },
    /** Led by Latade, waiting for review. */
    inReviewJob: "Metal Fabrication",
} as const;

/** Answers the browser's direct upload to Cloudinary with a made-up file. */
export async function fakeCloudinaryUploads(page: Page) {
    let count = 0;
    await page.route(/api\.cloudinary\.com/, async (route) => {
        count += 1;
        const publicId = `mande/e2e/review-attachment/test-${count}`;
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                public_id: publicId,
                // A real, tiny image, so previews load
                secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                format: "jpg",
                bytes: 1024,
                resource_type: "image",
            }),
        });
    });
}

/** A 1x1 PNG to pick in file inputs. */
export const TINY_PNG = {
    name: "delivery-proof.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"),
};

/**
 * Stands in for one API call (sign-off, reject...), whose real version would
 * check the made-up upload with Cloudinary, and keeps what the app sent.
 */
export async function captureApiCall(page: Page, urlPattern: RegExp, response: unknown) {
    const sent: unknown[] = [];
    await page.route(urlPattern, async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        sent.push(route.request().postDataJSON());
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
    });
    return sent;
}

/**
 * Logs in through the API, which leaves the refresh cookie in this test's
 * browser: the app then restores the session on its first page, as after a
 * reload. A session per test, since refresh tokens rotate (one can't be
 * shared between tests). The login form itself is tested in admin-login.
 */
export async function logInAs(page: Page, email: string) {
    const response = await page.request.post(`${API_URL}/api/v1/auth/login`, {
        data: { email, password: SEEDED.password },
        headers: { Origin: APP_URL },
    });
    expect(response.ok(), `logging in as ${email}`).toBeTruthy();
}

export const test = base.extend<{ uploads: void; asLead: void }>({
    uploads: [
        async ({ page }, use) => {
            await fakeCloudinaryUploads(page);
            await use();
        },
        { auto: true },
    ],
    // Signed in as the seeded project lead, unless a test file opts out
    asLead: [
        async ({ page }, use) => {
            await logInAs(page, SEEDED.lead.email);
            await use();
        },
        { auto: true },
    ],
});

export { expect, type Request };
