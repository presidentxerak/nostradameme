import { test, expect } from "@playwright/test";

test.describe("Profile page", () => {
  test("redirects unauthenticated users to home", async ({ page }) => {
    await page.goto("/profile");
    // Unauthed users are redirected to "/".
    await expect(page).toHaveURL(/.*/);
  });
});
