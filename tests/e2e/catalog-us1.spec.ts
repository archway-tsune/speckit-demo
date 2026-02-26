/** Catalog US1 - 商品一覧 E2E テスト (AC-1〜5) */
import { test, expect } from '@playwright/test';

test.describe('US1: 商品一覧を閲覧する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('認証なしで /catalog にアクセスできる (AC-1)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 0 });
  });

  test('商品カードが12件表示される (AC-1)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(12, { timeout: 0 });
  });

  test('「次へ」でページ2に移動すると残り3件が表示される (AC-2)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('pagination-next')).toBeVisible({ timeout: 0 });
    await page.getByTestId('pagination-next').click();
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(3, { timeout: 5000 });
  });

  test('在庫切れ商品に「在庫切れ」バッジが表示される (AC-3)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('在庫切れ').first()).toBeVisible({ timeout: 0 });
  });
});
