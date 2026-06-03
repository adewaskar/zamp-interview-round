import { test as base, expect } from "@playwright/test";

/**
 * Auth-aware test. Before each test, programmatically sign up a fresh user via
 * the API so the (httpOnly) auth cookie lands on the browser context. Every
 * test therefore runs as an isolated, empty account — deterministic regardless
 * of existing data, and no auth modal blocks the workspace.
 *
 * Specs that test the auth flow itself import `test` from `@playwright/test`
 * instead, so they start logged out.
 */
export const test = base.extend<{ autoAuth: void }>({
  autoAuth: [
    async ({ page }, use) => {
      const email = `e2e-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}@scout.test`;
      const res = await page.request.post("/api/auth/signup", {
        data: { email, password: "password123", name: "E2E User" },
      });
      if (!res.ok()) {
        throw new Error(
          `E2E signup failed (${res.status()}): ${await res.text()}`,
        );
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
