import { test, expect } from "@playwright/test";

// Starts logged out (does NOT use the auto-auth fixture).
test.describe("authentication", () => {
  test("sign up, log out, and log back in through the modal", async ({
    page,
  }) => {
    await page.goto("/");

    // The blocking gate is shown.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Welcome back/i)).toBeVisible();

    const email = `e2e-ui-${Date.now()}@scout.test`;
    const password = "password123";

    // Sign up a fresh account (click the Segmented label, not its hidden radio).
    await dialog.getByText("Sign up", { exact: true }).click();
    await dialog.getByRole("textbox", { name: "Email" }).fill(email);
    await dialog.getByRole("textbox", { name: "Password" }).fill(password);
    await dialog.getByRole("button", { name: "Create account" }).click();

    // Workspace mounts; the gate is gone.
    await expect(
      page.getByRole("heading", { name: /Welcome to Scout/i }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Log out → confirm in the dialog → the gate returns.
    await page.getByRole("button", { name: "Log out" }).click();
    const confirmDialog = page
      .getByRole("dialog")
      .filter({ hasText: "Log out of Scout?" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();

    // Log back in with the same credentials.
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(
      page.getByRole("heading", { name: /Welcome to Scout/i }),
    ).toBeVisible();
  });
});
