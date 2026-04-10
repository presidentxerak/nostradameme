import { test, expect } from "@playwright/test";

test.describe("Oracle page", () => {
  test("renders header, logo, and add funds", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /NOSTRADAMEME/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add Funds/i }),
    ).toBeVisible();
  });

  test("has slot tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/MATIN/i)).toBeVisible();
    await expect(page.getByText(/MIDI/i)).toBeVisible();
    await expect(page.getByText(/SOIR/i)).toBeVisible();
  });
});
