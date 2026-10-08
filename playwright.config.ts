import { defineConfig, devices } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Browser tests for the admin platform. They never touch your data or your
// running servers: global setup resets and seeds a database of their own
// (mande_e2e), then Playwright starts the API on :4100 against it (with email
// and the scheduled sweep off) and the app on :3100, built into .next-e2e so
// it runs beside your `npm run dev`. Uploads to Cloudinary are intercepted in
// the browser (see e2e/fixtures.ts), so no file leaves your machine.
//
// Needs: local MongoDB running (docker compose up -d mongo in mande-backend).
// Run: npm run test:e2e   (npm run test:e2e -- --ui to watch them)
// ─────────────────────────────────────────────────────────────────────────────

export const E2E_DB = "mongodb://127.0.0.1:27017/mande_e2e?directConnection=true";
const API_PORT = 4100;
const APP_PORT = 3100;
export const APP_URL = `http://localhost:${APP_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;

/** The API's settings for the run: the rest come from mande-backend/.env, which these override. */
export const API_ENV = {
    NODE_ENV: "development" as const,
    PORT: String(API_PORT),
    MONGODB_URI: E2E_DB,
    APP_URL,
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
    projects: [{ name: "admin", use: { ...devices["Desktop Chrome"] } }],
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
    ],
});
