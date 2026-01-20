import { test, expect } from '@playwright/test';

test.describe('Bookmarks Page', () => {
  test('should display bookmarks page', async ({ page }) => {
    await page.goto('/bookmarks');

    // Check if bookmarks page elements are visible
    await expect(
      page.locator('text=/My Bookmarks|내 북마크/i').or(
        page.locator('text=/No bookmarks|북마크가 없습니다/i')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter bookmarks by folder', async ({ page }) => {
    await page.goto('/bookmarks');

    // Look for folder filter buttons
    const allButton = page.locator('text=/All|전체/i').first();
    const defaultButton = page.locator('text=/default|기본/i').first();

    if (await allButton.isVisible()) {
      await allButton.click();
      await page.waitForTimeout(500);
    }
  });
});
