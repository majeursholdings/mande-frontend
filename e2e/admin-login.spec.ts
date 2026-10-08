import { test as base } from "@playwright/test";
import { expect, SEEDED } from "./fixtures";

// Logging in from scratch, through the form: not signed in first
const fromScratch = base;

fromScratch.describe("admin login", () => {
    fromScratch("refuses a wrong password and stays on the login page", async ({ page }) => {
        await page.goto("/admin/login");
        await page.getByLabel("Email").fill(SEEDED.lead.email);
        await page.getByLabel("Password", { exact: true }).fill("Not-the-password-1!");
        await page.getByRole("button", { name: "Login" }).click();
        await expect(page.getByText(/isn.t right|incorrect|invalid/i).first()).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    fromScratch("logs a project lead in to their dashboard", async ({ page }) => {
        await page.goto("/admin/login");
        await page.getByLabel("Email").fill(SEEDED.lead.email);
        await page.getByLabel("Password", { exact: true }).fill(SEEDED.password);
        await page.getByRole("button", { name: "Login" }).click();
        await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
});
