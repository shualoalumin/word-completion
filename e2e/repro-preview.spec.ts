import { test, expect } from '@playwright/test';

/**
 * Reproduce /practice/text-completion on production build (minified).
 * Fails if the page throws "Cannot access ... before initialization" or similar.
 */
test.describe('Practice text-completion (preview build)', () => {
  test('loads /practice/text-completion without initialization error', async ({ page }, testInfo) => {
    const consoleErrors: { type: string; text: string }[] = [];
    const consoleAll: { type: string; text: string }[] = [];
    const pageErrors: string[] = [];
    const requestFailures: { url: string; method: string; failureText: string | null }[] = [];
    const badResponses: { url: string; status: number; statusText: string }[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      consoleAll.push({ type, text });
      if (type === 'error' || text.includes('before initialization') || text.includes('ReferenceError')) {
        consoleErrors.push({ type, text });
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });
    page.on('requestfailed', (request) => {
      requestFailures.push({
        url: request.url(),
        method: request.method(),
        failureText: request.failure()?.errorText || null,
      });
    });
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        badResponses.push({
          url: response.url(),
          status,
          statusText: response.statusText(),
        });
      }
    });

    // Vite preview has no SPA fallback: load root first, then client-side navigate
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Practice Free|No Sign-up/i }).first().click();
    await page.waitForURL(/\/practice\/text-completion/, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Fail first if we got "Cannot access ... before initialization" or ReferenceError
    const badErrors = consoleErrors.filter(
      (e) =>
        e.text.includes('before initialization') ||
        e.text.includes('ReferenceError') ||
        /Cannot access . before initialization/.test(e.text)
    );
    expect(
      badErrors,
      badErrors.length ? `Console had: ${badErrors.map((e) => e.text).join('; ')}` : undefined
    ).toHaveLength(0);

    // Page should show exercise title, Get Ready, or Demo banner within 25s
    const title = page.locator('text=Fill in the missing letters');
    const getReady = page.locator('text=/Get Ready|준비/');
    const demoBanner = page.locator('text=Demo Mode');
    const url = page.url();
    const body = await page.locator('body').innerText().catch(() => '');
    const screenshotPath = testInfo.outputPath('repro-preview.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('repro-preview.png', {
      path: screenshotPath,
      contentType: 'image/png',
    });
    await testInfo.attach('console.log', {
      body: Buffer.from(
        JSON.stringify({ console: consoleAll, pageErrors, requestFailures, badResponses }, null, 2),
        'utf-8'
      ),
      contentType: 'application/json',
    });

    try {
      await expect(title.or(getReady).or(demoBanner)).toBeVisible({ timeout: 25000 });
    } catch (e) {
      throw new Error(
        `${(e as Error).message}. URL after load: ${url}. Body text length: ${body.length}. First 500 chars: ${body.slice(0, 500)}`
      );
    }
  });
});
