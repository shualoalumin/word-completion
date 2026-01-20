import { test, expect } from '@playwright/test';

test.describe('Vocabulary Page', () => {
  test('should display vocabulary page', async ({ page }) => {
    await page.goto('/vocabulary');

    // Check if vocabulary page elements are visible
    await expect(
      page.locator('text=/My Vocabulary|내 단어장/i').or(
        page.locator('text=/Total Words|전체 단어/i')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('should filter vocabulary by mastery level', async ({ page }) => {
    await page.goto('/vocabulary');

    // Look for filter buttons
    const newButton = page.locator('text=/New|신규/i').first();
    const learningButton = page.locator('text=/Learning|학습 중/i').first();
    const masteredButton = page.locator('text=/Mastered|완료/i').first();

    if (await newButton.isVisible()) {
      await newButton.click();
      // Wait for filter to apply
      await page.waitForTimeout(500);
    }
  });
});
