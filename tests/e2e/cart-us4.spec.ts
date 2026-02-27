/** Cart US4 - カートから商品を削除する E2E テスト (AC-1,2,3,4) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001'; // ミニマルTシャツ, stock=50

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

test.describe('US4: カートから商品を削除する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('削除ボタン → ConfirmDialog 表示 → 確認 → 商品が削除される (AC-1,2,3)', async ({ page }) => {
    await loginAsBuyer(page);

    // カートに商品を追加
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 1 },
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 削除ボタンをクリック → ConfirmDialog が表示される (AC-1)
    await page.getByRole('button', { name: /を削除/i }).click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible({ timeout: 5000 });

    // 削除を確認 (AC-2)
    await page.getByTestId('confirm-button').click();

    // 商品が削除され空カートメッセージが表示される (AC-3)
    await expect(page.locator('text=カートに商品がありません')).toBeVisible({ timeout: 5000 });
  });

  test('削除ボタン → ConfirmDialog 表示 → キャンセル → 商品が残る (AC-4)', async ({ page }) => {
    await loginAsBuyer(page);

    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 1 },
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /を削除/i }).click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible({ timeout: 5000 });

    // キャンセルをクリック → ダイアログが閉じる (AC-4)
    await page.getByTestId('cancel-button').click();

    await expect(page.getByTestId('confirm-dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('quantity-value')).toBeVisible({ timeout: 0 });
  });
});
