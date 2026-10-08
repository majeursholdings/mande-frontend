import { test, expect } from "./fixtures";

test.describe("manufacturers", () => {
    test("lists them, and opens a profile at its readable userId", async ({ page }) => {
        await page.goto("/admin/manufacturers");
        await expect(page.getByRole("heading", { name: "Manufacturers", exact: true })).toBeVisible();
        // Every name links to its profile
        const profileLink = page.locator('a[href^="/admin/manufacturers/"]').first();
        await expect(profileLink).toBeVisible();
        await profileLink.click();
        // e.g. /admin/manufacturers/Demi-Ade-1790835609603-1234, never a database id
        await expect(page).toHaveURL(/\/admin\/manufacturers\/[A-Za-z][^/]*-\d{10,}(-\d{4})?$/);
        await expect(page.getByRole("tab", { name: "More Info" }).or(page.getByText("More Info")).first()).toBeVisible();
        // Their rank and star rating beside their name
        await expect(page.getByText(/Rising Maker|Skilled Maker|Pro Maker|Expert Maker|Master Craftsman/).first()).toBeVisible();
        await expect(page.getByLabel(/^Rated \d\.\d out of 5$/).or(page.getByText("Not rated yet")).first()).toBeVisible();
    });
});
