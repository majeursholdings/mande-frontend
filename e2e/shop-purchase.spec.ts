import type { Browser, Page } from "@playwright/test";
import { API_URL, APP_URL, SHOP_URL } from "../playwright.config";
import { SEEDED, expect, logInAs, test } from "./fixtures";

// ─────────────────────────────────────────────────────────────────────────────
// A shop order from start to finish (SHOP_IMPLEMENTATION.md, phase 3): a
// customer buys from two sellers on the shop, the manufacturer ships their
// part on the app, staff cancel MANDE's part (refunded to the card), and the
// customer confirms delivery and reviews the product and the seller.
//
// Three people, each in a browser context of their own (their own cookies):
// the customer on the shop (:3120), the manufacturer and the project lead on
// the app (:3100). Payments and refunds go to the API's pretend platform
// (E2E_FAKE_PAYMENTS): its "payment page" sends the customer straight back
// to /checkout/complete, paid.
// ─────────────────────────────────────────────────────────────────────────────

/** From the backend's seed (src/scripts/seed.ts). */
const SHOP = {
    customer: { email: "customer@example.com", firstName: "Ada" },
    manufacturer: { email: "demi@majeurs.ng", seller: "Majeurs Chesterfield" },
    /** Majeurs Chesterfield's, in stock. */
    manufacturerProduct: { slug: "tufted-leather-armchair", title: "Tufted leather armchair" },
    /** MANDE stock: ₦85,000, plus ₦5,000 delivery to Lagos. */
    mandeProduct: { slug: "full-length-standing-mirror", title: "Full-length standing mirror", refund: "₦90,000" },
} as const;

async function newPage(browser: Browser, baseURL: string): Promise<Page> {
    const context = await browser.newContext({ baseURL });
    return context.newPage();
}

/** The part of an order one seller sends, on the customer's order page. */
const partFrom = (page: Page, seller: string) => page.locator("section").filter({ hasText: `Sold by ${seller}` });

/** Opens an order on a seller's Orders page (the table row, then its dialog). */
async function openSellerOrder(page: Page, path: string, code: string) {
    await page.goto(path);
    await page.getByRole("row").filter({ hasText: code }).click();
    const dialog = page.getByRole("dialog", { name: `Order ${code}` });
    await expect(dialog).toBeVisible();
    return dialog;
}

test("a customer buys from two sellers, a seller ships, staff refund one part, the customer reviews", async ({ page: staff, browser }) => {
    test.setTimeout(120_000);

    // ─── The customer signs in on the shop and fills the cart from two sellers ───
    const customer = await newPage(browser, SHOP_URL);
    await customer.goto("/login");
    await customer.getByLabel("Email").fill(SHOP.customer.email);
    await customer.getByLabel("Password", { exact: true }).fill(SEEDED.password);
    await customer.getByRole("button", { name: "Sign in" }).click();
    await expect(customer.getByText(`Welcome back, ${SHOP.customer.firstName}`)).toBeVisible();

    for (const product of [SHOP.manufacturerProduct, SHOP.mandeProduct]) {
        await customer.goto(`/p/${product.slug}`);
        await expect(customer.getByRole("heading", { name: product.title, level: 1 })).toBeVisible();
        await customer.getByRole("button", { name: "Add to cart" }).click();
        await expect(customer.getByText(`${product.title} is in your cart.`)).toBeVisible();
    }

    // ─── Checkout: the saved Lagos address, then the (pretend) payment page ───
    await customer.goto("/checkout");
    await expect(customer.getByRole("radio", { name: /Home/ })).toBeChecked();
    const pay = customer.getByRole("button", { name: /^Pay ₦/ });
    await expect(pay).toBeEnabled();
    await pay.click();
    await customer.waitForURL(/\/checkout\/complete\?reference=shp_/);
    await expect(customer.getByRole("heading", { name: "Thank you for your order" })).toBeVisible();
    const code = (await customer.getByText(/^SO-[2-9A-HJ-NP-Z]{6}$/).first().textContent())?.trim() ?? "";
    expect(code).toMatch(/^SO-/);

    // ─── The manufacturer ships their part, on the app ───
    const seller = await newPage(browser, APP_URL);
    // The seed leaves Demi a finished job to rate: the app asks whenever a page opens, which isn't this test
    const ratePrompt = seller.getByRole("dialog", { name: "Rate Project Lead Performance" });
    await seller.addLocatorHandler(ratePrompt, () => ratePrompt.getByRole("button", { name: "Close" }).first().click());
    await logInAs(seller, SHOP.manufacturer.email);
    let dialog = await openSellerOrder(seller, "/manufacturer/shop/orders", code);
    await expect(dialog.getByText(SHOP.manufacturerProduct.title)).toBeVisible();
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await dialog.getByLabel("A note for the customer (optional)").fill("Sent with GIG Logistics, waybill 12345");
    await dialog.getByRole("button", { name: "Mark as shipped" }).click();
    await expect(seller.getByText("Marked as shipped. The customer has been told.")).toBeVisible();
    await expect(dialog.getByText("Shipped", { exact: true })).toBeVisible();

    // ─── Staff cancel MANDE's part: the customer is refunded to their card ───
    dialog = await openSellerOrder(staff, "/admin/shop/orders", code);
    await expect(dialog.getByText(SHOP.mandeProduct.title)).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel order" }).click();
    await dialog.getByLabel("Why are you cancelling?").fill("The last mirror was damaged in the warehouse");
    await dialog.getByRole("button", { name: "Cancel and refund" }).click();
    await expect(staff.getByText("Order cancelled. The customer is being refunded.")).toBeVisible();

    // ─── The customer sees both, confirms delivery and writes reviews ───
    await customer.goto(`/account/orders/${code}`);
    const mandePart = partFrom(customer, "MANDE");
    await expect(mandePart.getByText("Cancelled", { exact: true })).toBeVisible();
    await expect(customer.getByText("Refunded to your card")).toBeVisible();
    await expect(customer.getByText(SHOP.mandeProduct.refund, { exact: true }).last()).toBeVisible();

    const majeursPart = partFrom(customer, SHOP.manufacturer.seller);
    await expect(majeursPart.getByText("On its way", { exact: true })).toBeVisible();
    await expect(majeursPart.getByText("Sent with GIG Logistics, waybill 12345")).toBeVisible();
    await majeursPart.getByRole("button", { name: "It arrived" }).click();
    await expect(customer.getByText("Thanks! Glad it arrived.")).toBeVisible();
    await expect(majeursPart.getByText("Delivered", { exact: true })).toBeVisible();

    // The product
    await majeursPart.getByRole("button", { name: "Review this product" }).click();
    let review = customer.getByRole("dialog", { name: `Review ${SHOP.manufacturerProduct.title}` });
    await review.getByRole("radio", { name: "5 stars" }).click();
    await review.getByLabel(/Your review/).fill("Solid frame and the leather matched the photos.");
    await review.getByRole("button", { name: "Post review" }).click();
    await expect(review).toBeHidden();
    await expect(majeursPart.getByText("Your review:")).toBeVisible();
    await expect(majeursPart.getByRole("img", { name: "5 out of 5 stars" })).toBeVisible();

    // The seller
    await majeursPart.getByRole("button", { name: `Review ${SHOP.manufacturer.seller}` }).click();
    review = customer.getByRole("dialog", { name: `Review ${SHOP.manufacturer.seller}` });
    await review.getByRole("radio", { name: "4 stars" }).click();
    await review.getByRole("button", { name: "Post review" }).click();
    await expect(review).toBeHidden();
    await expect(majeursPart.getByText(`Your review of ${SHOP.manufacturer.seller}:`)).toBeVisible();
    await expect(majeursPart.getByRole("img", { name: "4 out of 5 stars" })).toBeVisible();

    // Both are in their reviews, and the product's is public (the product page itself is cached for a couple of minutes)
    await customer.goto("/account/reviews");
    await expect(customer.getByText("Nothing waiting for a review")).toBeVisible();
    await customer.getByRole("link", { name: "Your reviews" }).click();
    await expect(customer.getByText("Solid frame and the leather matched the photos.")).toBeVisible();
    const published = await customer.request.get(`${API_URL}/api/v1/shop/products/${SHOP.manufacturerProduct.slug}/reviews`);
    expect(published.ok()).toBeTruthy();
    expect(JSON.stringify(await published.json())).toContain("Solid frame and the leather matched the photos.");
});
