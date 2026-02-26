/** Catalog US2 - 商品詳細 E2E テスト (AC-1〜4) */
import { test, expect } from '@playwright/test';

test.describe('US2: 商品詳細を確認する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('商品詳細ページで全情報を確認できる (AC-1)', async ({ page }) => {
    // ミニマルTシャツ (stock=50)
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440001');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('ミニマルTシャツ', { timeout: 0 });
    await expect(page.locator('text=¥4,980')).toBeVisible({ timeout: 0 });
    // 在庫数が表示される
    await expect(page.locator('text=/50/')).toBeVisible({ timeout: 0 });
  });

  test('在庫切れ商品のカート追加ボタンが無効化されている (AC-2)', async ({ page }) => {
    // デニムパンツ (stock=0, id: 550e8400-e29b-41d4-a716-446655440005)
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440005');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('デニムパンツ', { timeout: 0 });
    const button = page.getByRole('button', { name: /在庫切れ|カートに追加/i });
    await expect(button).toBeVisible({ timeout: 0 });
    await expect(button).toBeDisabled({ timeout: 0 });
  });

  test('imageUrl なし商品でプレースホルダー画像が表示される (AC-3)', async ({ page }) => {
    // 腕時計 (imageUrl なし, id: 550e8400-e29b-41d4-a716-44665544000d)
    await page.goto('/catalog/550e8400-e29b-41d4-a716-44665544000d');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="image-placeholder"]')).toBeVisible({ timeout: 0 });
  });

  test('「一覧に戻る」ボタンで商品一覧に遷移する (AC-4)', async ({ page }) => {
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440001');
    await page.waitForLoadState('networkidle');
    const backButton = page.getByRole('button', { name: /一覧に戻る|戻る/i });
    await expect(backButton).toBeVisible({ timeout: 0 });
    await backButton.click();
    await expect(page).toHaveURL('/catalog', { timeout: 5000 });
  });
});
