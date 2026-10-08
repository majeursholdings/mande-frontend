import { execSync } from "node:child_process";
import path from "node:path";
import { API_ENV } from "../playwright.config";

// Resets the tests' own database (it refuses any other), then seeds it with
// the sample platform: the project leads, manufacturers and 31 jobs the
// tests open. Seeding replaces the jobs, so every run starts the same.
export default function globalSetup() {
    const backend = path.resolve(__dirname, "../../mande-backend");
    const env = { ...process.env, ...API_ENV };
    for (const script of ["e2e:reset", "seed"]) {
        execSync(`npm run ${script}`, { cwd: backend, env, stdio: "pipe" });
    }
}
