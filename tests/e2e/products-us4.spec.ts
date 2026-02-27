/** Products US4 - ステータス変更 E2E テスト (AC-1, AC-2) */
import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('US4: ステータス変更', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('published 商品のドロップダウンで「下書き」を選択するとバッジが更新される (AC-1)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    // 商品テーブルが表示されるまで待機
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 5000 });

    // E2Eテスト商品（published）の行を特定
    const targetRow = page.locator('[data-testid="product-row"]').filter({ hasText: 'E2Eテスト商品' });
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // published → draft に変更
    const statusSelect = targetRow.locator('[data-testid="status-select"]');
    await statusSelect.selectOption('draft');

    // ステータスバッジが「下書き」に変わる（ページリロードなし）
    const statusBadge = targetRow.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toHaveText('下書き', { timeout: 5000 });
  });

  test('published 商品のドロップダウンで「アーカイブ」を選択するとバッジが更新される (AC-2)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    // 商品テーブルが表示されるまで待機
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 5000 });

    // E2Eテスト商品（published）の行を特定
    const targetRow = page.locator('[data-testid="product-row"]').filter({ hasText: 'E2Eテスト商品' });
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // published → archived に変更
    const statusSelect = targetRow.locator('[data-testid="status-select"]');
    await statusSelect.selectOption('archived');

    // ステータスバッジが「アーカイブ」に変わる（ページリロードなし）
    const statusBadge = targetRow.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toHaveText('アーカイブ', { timeout: 5000 });
  });
});
