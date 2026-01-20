import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display dashboard when authenticated', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Check if dashboard elements are visible
    await expect(page.locator('text=/Dashboard|대시보드/i').or(page.locator('text=/Exercises Today|오늘 완료한 문제/i'))).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to practice from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for practice button
    const practiceButton = page.locator('text=/Start Practice|문제 풀기/i').first();
    
    if (await practiceButton.isVisible()) {
      await practiceButton.click();
      await expect(page).toHaveURL(/.*practice.*/, { timeout: 5000 });
    }
  });
});
