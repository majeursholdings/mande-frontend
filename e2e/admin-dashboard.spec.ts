import { test, expect } from "./fixtures";

test.describe("the project lead's dashboard", () => {
    test("shows their own overview cards and standing, and no platform transactions", async ({ page }) => {
        await page.goto("/admin/dashboard");
        for (const label of ["Manufacturers on Mande", "Your jobs, all time", "Paid out on your jobs", "Your points"]) {
            await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
        }
        // Their stars on the points card; their rank in the sidebar, not on the card
        await expect(page.getByText("Average rating")).toBeVisible();
        const sidebar = page.getByRole("complementary");
        await expect(sidebar.getByText("Your rank")).toBeVisible();
        await expect(sidebar.getByText(/Associate Lead|Senior Lead|Principal Lead/)).toBeVisible();
        const pointsCard = page.locator("section").filter({ has: page.getByRole("heading", { name: "Your points", exact: true }) });
        await expect(pointsCard.getByText(/Associate Lead|Senior Lead|Principal Lead/)).toHaveCount(0);
        await expect(page.getByText("Recent Transactions", { exact: false })).toHaveCount(0);
    });

    test("keeps the sidebar in place, full height, while the page scrolls", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 600 });
        await page.goto("/admin/dashboard");
        await expect(page.getByRole("heading", { name: "Your points", exact: true })).toBeVisible();
        const sidebar = page.getByRole("complementary");
        await page.mouse.wheel(0, 2000);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        const box = await sidebar.boundingBox();
        expect(box?.y).toBe(0);
        expect(box?.height).toBe(600);
        await expect(sidebar.getByRole("button", { name: "Logout" })).toBeInViewport();
    });
});
