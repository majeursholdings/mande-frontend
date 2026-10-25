import { execSync } from "node:child_process";
import path from "node:path";
import type { Browser, Page } from "@playwright/test";
import { API_ENV, APP_URL, SHOP_URL } from "../playwright.config";
import { SEEDED, expect, logInAs, test } from "./fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// Affiliates from start to finish (SHOP_IMPLEMENTATION.md 5.7): Ada shares
// her referral link, Bola opens it and buys MANDE stock, staff ship it and
// Bola confirms it arrived; once the return window has passed Ada's points
// are spendable, and she spends them at checkout. Then Bola buys again with
// Ada's personal coupon, gets its discount, and Ada's points are on the way.
//
// Three people in browser contexts of their own: Ada and Bola on the shop
// (:3120), the project lead on the app (:3100). Payments go to the API's
// pretend platform (E2E_FAKE_PAYMENTS). The week-long return window is
// passed with a backend script for the e2e database only.
// ─────────────────────────────────────────────────────────────────────────────

/** From the backend's seed (src/scripts/seed.ts). */
const SEED = {
    ada: { email: "customer@example.com", firstName: "Ada", link: "ADAOBI", coupon: "ADA10" },
    bola: { email: "bola@example.com", firstName: "Bola" },
    /** MANDE stock in the program: ₦85,000 plus ₦5,000 delivery to Lagos, full reward after 3 sales. */
    mirror: { slug: "full-length-standing-mirror", title: "Full-length standing mirror" },
    /** 99% of ₦85,000 over 3 sales; with ADA10, 99% of ₦76,500 over 3. */
    points: { link: "28,050", coupon: "25,245" },
} as const;

async function newPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext({ baseURL: SHOP_URL });
    return context.newPage();
}

async function signIn(page: Page, email: string, firstName: string) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(SEEDED.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(`Welcome back, ${firstName}`)).toBeVisible();
}

async function addMirror(page: Page) {
    await page.goto(`/p/${SEED.mirror.slug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText(`${SEED.mirror.title} is in your cart.`)).toBeVisible();
}

/** Pays on the checkout page, and answers the order's code. */
async function payAt(page: Page, amount: string) {
    const pay = page.getByRole("button", { name: `Pay ${amount}` });
    await expect(pay).toBeEnabled();
    await pay.click();
    await page.waitForURL(/\/checkout\/complete\?reference=shp_/);
    await expect(page.getByRole("heading", { name: "Thank you for your order" })).toBeVisible();
    return (await page.getByText(/^SO-[2-9A-HJ-NP-Z]{6}$/).first().textContent())?.trim() ?? "";
}

/** The "points become spendable" task, run as if the order's return window had passed. */
function passReturnWindow(code: string) {
    execSync(`npm run e2e:pass-return-window -- ${code}`, { cwd: path.resolve(__dirname, "../../mande-backend"), env: { ...process.env, ...API_ENV }, stdio: "pipe" });
}

test("a referral link sale earns points that are spent, then a personal coupon gives its discount", async ({ page: staff, browser }) => {
    test.setTimeout(150_000);

    // ─── Ada has her link and coupon on her rewards page ───
    const ada = await newPage(browser);
    await signIn(ada, SEED.ada.email, SEED.ada.firstName);
    await ada.goto("/account/rewards");
    await expect(ada.getByText(`${SHOP_URL}/?ref=${SEED.ada.link}`)).toBeVisible();
    await expect(ada.getByText(SEED.ada.coupon, { exact: true })).toBeVisible();

    // ─── Bola opens the link: it's remembered, and the address is cleaned up ───
    const bola = await newPage(browser);
    await bola.goto(`/?ref=${SEED.ada.link}`);
    await expect(bola).toHaveURL(`${SHOP_URL}/`);
    expect((await bola.context().cookies()).find((cookie) => cookie.name === "mande_ref")?.value).toMatch(new RegExp(`^${SEED.ada.link}\\.\\d+$`));

    // ─── Bola buys the mirror: the link changes nothing she pays ───
    await signIn(bola, SEED.bola.email, SEED.bola.firstName);
    await addMirror(bola);
    await bola.goto("/checkout");
    const code = await payAt(bola, "₦90,000");

    // Ada's points are on the way
    await ada.goto("/account/rewards");
    await expect(ada.getByText(`${SEED.points.link} on the way`)).toBeVisible();

    // ─── Staff ship it; Bola confirms it arrived ───
    await logInAs(staff, "lead@mande.com.ng");
    await staff.goto(`${APP_URL}/admin/shop/orders`);
    await staff.getByRole("row").filter({ hasText: code }).click();
    const dialog = staff.getByRole("dialog", { name: `Order ${code}` });
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await expect(staff.getByText("Marked as shipped. The customer has been told.")).toBeVisible();
    await bola.goto(`/account/orders/${code}`);
    await bola.getByRole("button", { name: "It arrived" }).click();
    await expect(bola.getByText("Thanks! Glad it arrived.")).toBeVisible();

    // ─── The return window passes: Ada's points are spendable, and she spends them ───
    passReturnWindow(code);
    await ada.goto("/account/rewards");
    await expect(ada.getByText("Points to spend").locator("..").getByText(SEED.points.link, { exact: true })).toBeVisible();
    await addMirror(ada);
    await ada.goto("/checkout");
    await expect(ada.getByText("Reward points", { exact: true })).toBeVisible();
    // ₦90,000 less 28,050 points
    await payAt(ada, "₦61,950");
    await ada.goto("/account/rewards");
    await expect(ada.getByText("Points to spend").locator("..").getByText("0", { exact: true })).toBeVisible();

    // ─── Bola buys again with Ada's coupon: 10% off the mirror, and Ada earns ───
    await addMirror(bola);
    await bola.goto("/checkout");
    await bola.getByLabel("Coupon code").fill(SEED.ada.coupon.toLowerCase());
    await bola.getByRole("button", { name: "Apply" }).click();
    await expect(bola.getByText("₦8,500 off MANDE's items")).toBeVisible();
    await payAt(bola, "₦81,500");
    await ada.goto("/account/rewards");
    await expect(ada.getByText(`${SEED.points.coupon} on the way`)).toBeVisible();
});
