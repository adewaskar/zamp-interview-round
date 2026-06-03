import { test, expect } from "./fixtures";

test.describe("sub-agent manager", () => {
  test("validates, creates, and deletes a sub-agent", async ({ page }) => {
    await page.goto("/");

    // Open the manager drawer (imperative useDrawer).
    await page.getByRole("button", { name: /Manage sub-agents/i }).click();
    await expect(page.locator(".ant-drawer-title")).toContainText("Sub-agents");

    // Open the editor modal (imperative useModal).
    await page.getByRole("button", { name: "New agent" }).click();
    await expect(page.locator(".ant-modal-title")).toHaveText("New sub-agent");

    // Submitting empty surfaces the zod-derived required rules.
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("name is required")).toBeVisible();
    await expect(page.getByText("description is required")).toBeVisible();
    await expect(page.getByText("instructions is required")).toBeVisible();

    // Fill and create (unique name so the run is idempotent).
    const name = `E2E Agent ${Date.now()}`;
    await page.locator("#name").fill(name);
    await page
      .locator("#description")
      .fill("Created by an automated end-to-end test.");
    await page
      .locator("#instructions")
      .fill("You are a test sub-agent used to verify the create flow.");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // The new card appears (its delete control carries the agent name).
    const deleteButton = page.getByRole("button", { name: `Delete ${name}` });
    await expect(deleteButton).toBeVisible();

    // Clean up: delete it and confirm via the Popconfirm. Move the pointer off
    // the trash icon first so its hover Tooltip doesn't overlap the confirm.
    await deleteButton.click();
    await page.mouse.move(10, 10);
    await page.locator(".ant-popconfirm-buttons .ant-btn-primary").click();
    await expect(deleteButton).toHaveCount(0);
  });
});
