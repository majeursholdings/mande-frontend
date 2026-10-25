import type { APIRequestContext, Browser, Page } from "@playwright/test";
import { API_URL, APP_URL, SHOP_URL } from "../playwright.config";
import { SEEDED, expect, test } from "./fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// Made-to-order MANDE stock (SHOP_IMPLEMENTATION.md 5.2): a customer buys the
// reception desk on the shop, the project lead turns the order line into a job
// from the order (the job form prefilled from the product's job template), the
// customer sees it in production, the manufacturer makes it and staff sign it
// off, the line shows "Ready to ship", staff ship it, and Revenue counts
// what the job paid as the Shop area's cost.
//
// The shop parts run in the browser. The job's production steps run through
// the real API as the manufacturer and staff (a super admin) would send them (the job pages
// themselves are covered by admin-jobs): their photos are uploads in each
// person's own folder, which the e2e API accepts without asking Cloudinary
// (E2E_FAKE_UPLOADS).
// ─────────────────────────────────────────────────────────────────────────────

const DESK = { slug: "reception-desk", title: "Reception desk" } as const;
const CUSTOMER = { email: "customer@example.com", firstName: "Ada" } as const;
const MANUFACTURER = "dansteve@shavings.ng";
const SUPER_ADMIN = "superadmin@mande.com.ng";
const STEPS = ["design", "materials", "frame", "assembly", "finishing", "delivery"] as const;

async function newPage(browser: Browser, baseURL: string): Promise<Page> {
    const context = await browser.newContext({ baseURL });
    return context.newPage();
}

/** Signs in through the API and returns a caller with the person's access token, and their id. */
async function apiAs(request: APIRequestContext, email: string) {
    const response = await request.post(`${API_URL}/api/v1/auth/login`, { data: { email, password: SEEDED.password }, headers: { Origin: APP_URL } });
    expect(response.ok(), `logging in as ${email}`).toBeTruthy();
    return callerFrom(request, await response.json());
}

function callerFrom(request: APIRequestContext, body: { accessToken: string; user?: { id?: string; _id?: string } }) {
    const token = body.accessToken;
    const userId = (body.user?.id ?? body.user?._id) as string;
    const headers = { Authorization: `Bearer ${token}` };
    const call = async (method: "get" | "post" | "put", path: string, data?: unknown) => {
        const result = await request[method](`${API_URL}/api/v1${path}`, { headers, ...(data !== undefined && { data }) });
        expect(result.ok(), `${method.toUpperCase()} ${path}: ${await result.text()}`).toBeTruthy();
        return result.json();
    };
    return { userId, call };
}

let uploadCount = 0;
/** Uploads "made" in the person's own folder for `purpose`, as the browser would after a signed upload. */
const uploads = (userId: string, purpose: string, count: number) =>
    Array.from({ length: count }, () => `mande/development/${purpose}/${userId}/e2e-${Date.now()}-${(uploadCount += 1)}`);

/** Opens an order on the staff Orders page (the table row, then its dialog). */
async function openOrder(page: Page, code: string) {
    await page.goto("/admin/shop/orders");
    await page.getByRole("row").filter({ hasText: code }).click();
    const dialog = page.getByRole("dialog", { name: `Order ${code}` });
    await expect(dialog).toBeVisible();
    return dialog;
}

test("a made-to-order MANDE product goes from the shop through a job to the customer, and Revenue counts its cost", async ({ page: lead, browser, request }) => {
    test.setTimeout(180_000);

    // ─── The customer buys the reception desk ───
    const customer = await newPage(browser, SHOP_URL);
    await customer.goto("/login");
    await customer.getByLabel("Email").fill(CUSTOMER.email);
    await customer.getByLabel("Password", { exact: true }).fill(SEEDED.password);
    await customer.getByRole("button", { name: "Sign in" }).click();
    await expect(customer.getByText(`Welcome back, ${CUSTOMER.firstName}`)).toBeVisible();
    await customer.goto(`/p/${DESK.slug}`);
    await customer.getByRole("button", { name: "Add to cart" }).click();
    await expect(customer.getByText(`${DESK.title} is in your cart.`)).toBeVisible();
    await customer.goto("/checkout");
    const pay = customer.getByRole("button", { name: /^Pay ₦/ });
    await expect(pay).toBeEnabled();
    await pay.click();
    await customer.waitForURL(/\/checkout\/complete\?reference=shp_/);
    const code = (await customer.getByText(/^SO-[2-9A-HJ-NP-Z]{6}$/).first().textContent())?.trim() ?? "";
    expect(code).toMatch(/^SO-/);

    // ─── The lead makes the job from the order, the form filled in from the template ───
    let dialog = await openOrder(lead, code);
    await dialog.getByRole("button", { name: "Create job" }).click();
    const form = lead.getByRole("dialog", { name: `Create the job for ${code}` });
    await expect(form).toBeVisible();
    await expect(form.getByLabel("Job name")).toHaveValue(DESK.title);
    await form.getByRole("button", { name: "Next" }).click();
    await expect(form.getByLabel("Description")).toHaveValue(/walnut veneer/);
    await form.getByRole("button", { name: "Next" }).click();
    await form.getByRole("button", { name: "Create Job" }).click();
    await expect(lead.getByText("Job created successfully")).toBeVisible();
    dialog = await openOrder(lead, code);
    const jobLink = dialog.getByRole("link", { name: /^Job MD-/ });
    await expect(jobLink).toBeVisible();
    const jobId = new URL(await jobLink.getAttribute("href") ?? "", APP_URL).searchParams.get("job") ?? "";
    expect(jobId).not.toBe("");

    // ─── The customer sees it in production, with an estimate ───
    await customer.goto(`/account/orders/${code}`);
    await expect(customer.getByText(/^In production, ready by about /)).toBeVisible();

    // ─── The manufacturer makes it; staff approve each step and sign it off ───
    const maker = await apiAs(request, MANUFACTURER);
    // A super admin reviews and signs off (any job is theirs to act on): the lead's login is the browser's, and logins per email are rate-limited across the run
    const owner = await apiAs(request, SUPER_ADMIN);
    await maker.call("post", `/my-jobs/${jobId}/accept`);
    for (const step of STEPS) {
        await maker.call("post", `/my-jobs/${jobId}/steps/${step}/proof`, { photos: uploads(maker.userId, "step-proof", 3) });
        await owner.call("post", `/jobs/${jobId}/steps/${step}/review`, { outcome: "approved" });
    }
    await maker.call("post", `/my-jobs/${jobId}/submit`, { photos: uploads(maker.userId, "completion-photo", 2) });
    await owner.call("post", `/jobs/${jobId}/sign-off`, {
        rating: 5,
        comment: "Clean joinery, on time",
        clientProofs: uploads(owner.userId, "review-attachment", 1).map((publicId) => ({ publicId })),
    });

    // ─── The line is ready to ship; staff ship it and the customer sees it on its way ───
    dialog = await openOrder(lead, code);
    await expect(dialog.getByText("Ready to ship", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await expect(lead.getByText("Marked as shipped. The customer has been told.")).toBeVisible();
    await customer.goto(`/account/orders/${code}`);
    await expect(customer.getByText("On its way", { exact: true })).toBeVisible();

    // ─── Revenue: what the job paid is the Shop area's cost, named by the order ───
    const shopEntries = (await owner.call("get", "/reports/revenue?area=shop&limit=50")).entries as { type: string; direction: string; detail: string; amountKobo: number }[];
    const paidForOrder = shopEntries.filter((entry) => entry.direction === "out" && entry.detail.includes(code));
    expect(paidForOrder.length).toBeGreaterThan(0);
    expect(paidForOrder.reduce((sum, entry) => sum + entry.amountKobo, 0)).toBeGreaterThan(0);
    const jobsEntries = (await owner.call("get", "/reports/revenue?area=jobs&limit=50")).entries as { detail: string }[];
    expect(jobsEntries.some((entry) => entry.detail.includes(code))).toBe(false);
});
