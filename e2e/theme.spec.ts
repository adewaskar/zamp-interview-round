import { test, expect } from "@playwright/test";

const bgSum = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const [r, g, b] = getComputedStyle(document.body)
      .backgroundColor.match(/\d+/g)!
      .map(Number);
    return r + g + b;
  });

test.describe("theme toggle", () => {
  test("flips the surface light↔dark and persists across reloads", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByRole("switch", { name: "Toggle dark mode" });
    await expect(toggle).toBeVisible();

    // Light by default: the layout surface is bright.
    expect(await bgSum(page)).toBeGreaterThan(600);

    // Flip to dark — the antd dark algorithm darkens the whole surface.
    await toggle.click();
    await expect.poll(() => bgSum(page)).toBeLessThan(200);

    // Choice is persisted.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("scout-theme"),
    );
    expect(stored).toBe("dark");

    // ...and survives a reload.
    await page.reload();
    await expect(
      page.getByRole("switch", { name: "Toggle dark mode" }),
    ).toBeChecked();
    expect(await bgSum(page)).toBeLessThan(200);
  });
});
