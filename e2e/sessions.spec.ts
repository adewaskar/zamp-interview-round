import { test, expect } from "./fixtures";

test.describe("chat sessions", () => {
  test("starting a new chat reveals the composer", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Start a new chat/i }).click();

    // An active session swaps the welcome screen for the composer.
    await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible();
    await expect(page.getByText(/Enter to send/i)).toBeVisible();
  });
});
