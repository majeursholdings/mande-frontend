import { test as base, type Page } from "@playwright/test";
import { expect, fakeCloudinaryUploads, logInAs } from "./fixtures";

/** From the backend's seed: a manufacturer with jobs, a wallet and ratings. */
const MANUFACTURER = "demi@majeurs.ng";

/** The seeded manufacturer is asked to rate a lead on arrival: not now. */
async function dismissLeadReview(page: Page) {
    const rateLead = page.getByRole("dialog", { name: /Rate Project Lead/i });
    // It opens a moment after the page: wait for it (isVisible doesn't), then close it
    const appeared = await rateLead
        .waitFor({ state: "visible", timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
    if (appeared) await page.keyboard.press("Escape");
    await expect(rateLead).toBeHidden();
}

const asManufacturer = base.extend<{ signedIn: void }>({
    signedIn: [
        async ({ page }, use) => {
            await fakeCloudinaryUploads(page);
            await logInAs(page, MANUFACTURER);
            await use();
        },
        { auto: true },
    ],
});

asManufacturer.describe("the manufacturer's overview cards", () => {
    asManufacturer("shows the dashboard's four cards, and their rank in the sidebar", async ({ page }) => {
        await page.goto("/manufacturer/dashboard");
        await dismissLeadReview(page);
        for (const label of ["Total jobs", "Total amount made", "Delivery success rate", "Star rating"]) {
            await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
        }
        await expect(page.getByText("See in details").first()).toBeVisible();
        const sidebar = page.getByRole("complementary");
        await expect(sidebar.getByText("Your rank")).toBeVisible();
        await expect(sidebar.getByText(/Rising Maker|Skilled Maker|Pro Maker|Expert Maker|Master Craftsman/)).toBeVisible();
    });

    asManufacturer("shows the wallet's figures as cards on Transactions", async ({ page }) => {
        await page.goto("/manufacturer/transactions");
        for (const label of ["Total made", "Spent on subscriptions", "Current jobs worth"]) {
            await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
        }
    });

    asManufacturer("rates the project lead from the prompt: only the rating and review go to the API", async ({ page }) => {
        await page.goto("/manufacturer/dashboard");
        const rateLead = page.getByRole("dialog", { name: /Rate Project Lead/i });
        await expect(rateLead).toBeVisible();
        await rateLead.getByRole("radio", { name: /^5 stars/ }).click();
        await rateLead.getByLabel("Review").fill("Clear instructions and quick answers throughout the job.");
        const sent = page.waitForResponse((response) => /\/my-jobs\/[^/]+\/lead-review$/.test(response.url()));
        await rateLead.getByRole("button", { name: "Submit" }).click();
        // The real API: it refused an unknown "clientProofs" field before the fix
        expect((await sent).status()).toBe(201);
        await expect(page.getByText(/your review of .+ was sent/i)).toBeVisible();
    });

    asManufacturer("loads the job counts on Jobs", async ({ page }) => {
        await page.goto("/manufacturer/jobs");
        await dismissLeadReview(page);
        await expect(page.getByRole("heading", { name: "Active jobs", exact: true })).toBeVisible();
        await expect(page.getByText(/Couldn.t load your job counts/)).toHaveCount(0);
    });

    asManufacturer("shows every notification on its own page, linked from the bell", async ({ page }) => {
        await page.goto("/manufacturer/profile/notifications");
        await dismissLeadReview(page);
        await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
        await expect(page.getByText(/Couldn.t load your notifications/)).toHaveCount(0);
    });
});
