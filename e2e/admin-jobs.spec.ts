import { test, expect, SEEDED, TINY_PNG, captureApiCall } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

/** Picks the proof and waits for its upload to finish, as a person would before confirming. */
async function uploadProof(page: Page, dialog: Locator) {
    const uploaded = page.waitForResponse(/api\.cloudinary\.com/);
    await dialog.locator('input[type="file"]').first().setInputFiles(TINY_PNG);
    await uploaded;
    await expect(dialog.getByText(/0\.00 MB/)).toBeVisible();
}

/** Opens the seeded in-review job from the jobs board. */
async function openInReviewJob(page: Page) {
    await page.goto("/admin/jobs");
    // The board shows a page at a time: find it as a person would
    await page.getByLabel("Search by job name").fill(SEEDED.inReviewJob);
    await page.getByRole("button", { name: SEEDED.inReviewJob, exact: true }).first().click();
    const sheet = page.getByRole("dialog").filter({ hasText: SEEDED.inReviewJob });
    await expect(sheet).toBeVisible();
    return sheet;
}

test.describe("a job in review", () => {
    test("opens from the jobs board", async ({ page }) => {
        const sheet = await openInReviewJob(page);
        await expect(sheet.getByRole("button", { name: "Mark as completed" })).toBeEnabled();
        await expect(sheet.getByRole("button", { name: "Reject" })).toBeVisible();
    });

    test("signs off with the client's proof of delivery, sent as uploads the API takes", async ({ page }) => {
        const sent = await captureApiCall(page, /\/api\/v1\/jobs\/[^/]+\/sign-off$/, { job: {} });
        const sheet = await openInReviewJob(page);
        await sheet.getByRole("button", { name: "Mark as completed" }).click();

        const dialog = page.getByRole("dialog", { name: "Confirm Delivery & Sign Off" });
        await dialog.getByRole("radio", { name: /^5 stars/ }).or(dialog.getByRole("button", { name: /^5 stars/ })).first().click();
        await dialog.getByLabel("Review").fill("Delivered on time and finished well. The client is happy.");
        await uploadProof(page, dialog);
        await dialog.getByRole("button", { name: "Confirm Delivery & Complete Job" }).click();

        await expect(page.getByText(`${SEEDED.inReviewJob} is completed`)).toBeVisible();
        expect(sent).toHaveLength(1);
        expect(sent[0]).toEqual({
            rating: 5,
            comment: "Delivered on time and finished well. The client is happy.",
            // Only what the API's strict schema takes: no url or kind
            clientProofs: [{ publicId: expect.stringMatching(/^mande\/e2e\//), name: expect.any(String) }],
        });
    });

    test("rejects with the proof of the defect attached", async ({ page }) => {
        const sent = await captureApiCall(page, /\/api\/v1\/jobs\/[^/]+\/reject$/, { job: {} });
        const sheet = await openInReviewJob(page);
        await sheet.getByRole("button", { name: "Reject" }).click();

        const dialog = page.getByRole("dialog", { name: "Reject this job?" });
        await dialog.getByLabel("Your review").fill("The welds on the left frame are cracked and need redoing before delivery.");
        await uploadProof(page, dialog);
        await dialog.getByRole("button", { name: "Reject job" }).click();

        await expect(page.getByText(/Job rejected/)).toBeVisible();
        expect(sent).toHaveLength(1);
        expect(sent[0]).toEqual({
            reason: "The welds on the left frame are cracked and need redoing before delivery.",
            attachments: [{ publicId: expect.stringMatching(/^mande\/e2e\//), name: expect.any(String) }],
        });
    });
});
