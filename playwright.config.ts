import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E config. The specs exercise deterministic flows only (UI, sub-agent CRUD,
 * sessions, theming) — never the LLM/web-search round-trip — so they're stable
 * in CI without paid API keys.
 *
 * The app is served by `next dev`; locally we reuse an already-running dev
 * server, in CI Playwright starts one. The app reads `MONGODB_URI` from the
 * environment (a Mongo service container in CI, `.env` locally).
 */
export default defineConfig({
  testDir: "./e2e",
  // Specs mutate a shared Mongo, so keep them serial and deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev:next",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
