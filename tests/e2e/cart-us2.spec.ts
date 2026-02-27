/** Cart US2 - カート内容を確認する E2E テスト (AC-1, AC-2, AC-3) */
import { test, expect } from '@playwright/test';

test.describe('US2: カート内容を確認する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('ログイン済み購入者がカートページで商品合計・消費税・総合計を確認できる (AC-2)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForURL(/\/catalog/);

    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440000');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /カートに追加/i }).click();
    await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('cart-subtotal')).toBeVisible({ timeout: 0 });
    await expect(page.getByTestId('cart-tax')).toBeVisible({ timeout: 0 });
    await expect(page.getByTestId('cart-total')).toBeVisible({ timeout: 0 });
  });

  test('カートが空の場合は「カートに商品がありません」メッセージと商品一覧への導線が表示される (AC-3)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('buyer@example.com');
    await page.locator('#password').fill('demo');
    await page.getByRole('button', { name: /ログイン/i }).click();
    await page.waitForURL(/\/catalog/);

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=カートに商品がありません')).toBeVisible({ timeout: 0 });
    await expect(page.getByRole('link', { name: '商品一覧へ戻る' })).toBeVisible({ timeout: 0 });
  });
});
