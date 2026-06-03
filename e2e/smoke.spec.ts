import { test, expect } from "@playwright/test";

test.describe("app shell", () => {
  test("renders the welcome screen and branded sidebar", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Scout/);

    // Empty/welcome state (no session selected on first load).
    await expect(
      page.getByRole("heading", { name: /Welcome to Scout/i }),
    ).toBeVisible();
    await expect(
      page.getByText("A research agent that knows when to delegate."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Start a new chat/i }),
    ).toBeVisible();

    // Sidebar brand + primary action (scope to the rail; the welcome screen
    // also has a "Start a new chat" button).
    await expect(page.getByText("Research assistant")).toBeVisible();
    await expect(
      page.locator(".ant-layout-sider").getByRole("button", { name: "plus New chat" }),
    ).toBeVisible();
  });

  test("the left rail uses a dark, token-driven surface", async ({ page }) => {
    await page.goto("/");

    const sider = page.locator(".ant-layout-sider").first();
    await expect(sider).toBeVisible();

    // colorSiderBg (#0f1117) — assert a near-black background, proving the
    // sider is themed via tokens rather than the default light surface.
    const bg = await sider.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    expect(r + g + b).toBeLessThan(120);
  });
});
