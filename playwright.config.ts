import { defineConfig, devices } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Browser tests for the admin platform and the shop. They never touch your
// data or your running servers: global setup resets and seeds a database of
// their own (mande_e2e), then Playwright starts the API on :4100 against it
// (with email and the scheduled sweep off, and payments going to a pretend
// platform: E2E_FAKE_PAYMENTS, see mande-backend's integrations/payments/fake.ts),
// the app on :3100 and the shop (../mande-shop) on :3120, each built into
// .next-e2e so they run beside your `npm run dev`. Uploads to Cloudinary are
// intercepted in the browser (see e2e/fixtures.ts), so no file leaves your machine.
//
// Needs: local MongoDB running (docker compose up -d mongo in mande-backend).
// Run: npm run test:e2e   (npm run test:e2e -- --ui to watch them,
//      npm run test:e2e -- --project=shop for the shop's alone)
// ─────────────────────────────────────────────────────────────────────────────

export const E2E_DB = "mongodb://127.0.0.1:27017/mande_e2e?directConnection=true";
const API_PORT = 4100;
const APP_PORT = 3100;
const SHOP_PORT = 3120;
export const APP_URL = `http://localhost:${APP_PORT}`;
export const SHOP_URL = `http://localhost:${SHOP_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;

/** The API's settings for the run: the rest come from mande-backend/.env, which these override. */
export const API_ENV = {
    NODE_ENV: "development" as const,
    PORT: String(API_PORT),
    MONGODB_URI: E2E_DB,
    APP_URL,
    SHOP_URL,
    // Checkouts, refunds and payouts go to a pretend platform, never Paystack or
    // Flutterwave (the API only allows it for a database named *_e2e, never in production)
    E2E_FAKE_PAYMENTS: "true",
    // No email goes out: the seeded accounts use real-looking addresses
    SMTP_HOST: "",
    SMTP_USER: "",
    SMTP_PASSWORD: "",
    SCHEDULER_INTERVAL_MINUTES: "0",
};

export default defineConfig({
    testDir: "./e2e",
    globalSetup: "./e2e/global-setup.ts",
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    timeout: 60_000,
    expect: { timeout: 15_000 },
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: APP_URL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "admin", testIgnore: /shop-.*\.spec\.ts$/, use: { ...devices["Desktop Chrome"] } },
        // A customer on the shop, with the seller and staff on the app (each in a browser context of its own)
        { name: "shop", testMatch: /shop-.*\.spec\.ts$/, use: { ...devices["Desktop Chrome"] } },
    ],
    webServer: [
        {
            command: "npx tsx --env-file-if-exists=.env src/server.ts",
            cwd: "../mande-backend",
            url: `${API_URL}/health`,
            env: API_ENV,
            reuseExistingServer: false,
            timeout: 120_000,
            stdout: "ignore",
            stderr: "pipe",
        },
        {
            command: `npx next dev -p ${APP_PORT}`,
            url: APP_URL,
            env: {
                NEXT_DIST_DIR: ".next-e2e",
                NEXT_PUBLIC_API_URL: `${API_URL}/api/v1`,
                NEXT_PUBLIC_SOCKET_URL: API_URL,
                NEXT_PUBLIC_APP_URL: APP_URL,
            },
            reuseExistingServer: false,
            timeout: 180_000,
        },
        {
            command: `npx next dev -p ${SHOP_PORT}`,
            cwd: "../mande-shop",
            url: SHOP_URL,
            env: {
                NEXT_DIST_DIR: ".next-e2e",
                NEXT_PUBLIC_API_URL: `${API_URL}/api/v1`,
                NEXT_PUBLIC_SOCKET_URL: API_URL,
                NEXT_PUBLIC_SHOP_URL: SHOP_URL,
                NEXT_PUBLIC_MAIN_SITE_URL: APP_URL,
                // Nothing from the tests goes to Sentry
                NEXT_PUBLIC_SENTRY_DSN: "",
            },
            reuseExistingServer: false,
            timeout: 180_000,
        },
    ],
});
