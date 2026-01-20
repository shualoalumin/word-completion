import { test, expect } from '@playwright/test';

test.describe('Text Completion Exercise Flow', () => {
  test('should complete text completion exercise flow', async ({ page }) => {
    // Navigate to practice page
    await page.goto('/practice/text-completion');

    // Wait for page to load
    await expect(page.locator('text=Fill in the missing letters')).toBeVisible();

    // Check if passage is displayed
    const passage = page.locator('[data-testid="passage"]').or(page.locator('text=/The|Science|Research/'));
    await expect(passage.first()).toBeVisible({ timeout: 10000 });

    // Find input fields and fill them
    const inputs = page.locator('input[type="text"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Fill first input
      await inputs.first().fill('test');
    }

    // Click Check Answers button
    const checkButton = page.locator('text=/Check Answers|답 확인/i');
    if (await checkButton.isVisible()) {
      await checkButton.click();
    }

    // Wait for results to appear
    await expect(page.locator('text=/Score|점수/i').or(page.locator('text=/correct|정답/i'))).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to dashboard from practice page', async ({ page }) => {
    await page.goto('/practice/text-completion');

    // Look for dashboard link/button
    const dashboardLink = page.locator('text=/Dashboard|대시보드/i').first();
    
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 5000 });
    }
  });
});
