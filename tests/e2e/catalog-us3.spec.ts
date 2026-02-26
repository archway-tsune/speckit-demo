/** Catalog US3 - 商品検索 E2E テスト (AC-1,2,3) */
import { test, expect } from '@playwright/test';

test.describe('US3: 商品を検索する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('キーワードで商品を絞り込みできる (AC-1)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    // 検索バーに入力してEnter
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('Tシャツ');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // ミニマルTシャツのみ表示される
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(1, { timeout: 5000 });
    await expect(page.getByText('ミニマルTシャツ')).toBeVisible({ timeout: 5000 });
  });

  test('該当なしの場合メッセージが表示される (AC-2)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('xyznotexist123');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByText('該当する商品が見つかりませんでした')
    ).toBeVisible({ timeout: 5000 });
  });

  test('検索クリアで全商品一覧に戻る (AC-3)', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    // まず絞り込み
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('Tシャツ');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1, { timeout: 5000 });

    // クリアボタンでリセット
    await page.getByTestId('search-clear').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(12, { timeout: 5000 });
  });
});
