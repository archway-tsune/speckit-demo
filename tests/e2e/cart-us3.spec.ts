/** Cart US3 - カート数量変更 E2E テスト (AC-1, AC-2) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000'; // E2Eテスト商品, stock=10

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

test.describe('US3: カート数量を変更する', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('+ ボタンを押すと数量が増加し小計が更新される (AC-1)', async ({ page }) => {
    await loginAsBuyer(page);

    // セッション付きでカートに商品を追加
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 1 },
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('quantity-value')).toHaveText('1', { timeout: 0 });

    await page.getByTestId('quantity-increment').click();

    await expect(page.getByTestId('quantity-value')).toHaveText('2', { timeout: 5000 });
  });

  test('在庫を超える数量に変更するとエラーが表示される (AC-2)', async ({ page }) => {
    await loginAsBuyer(page);

    // 在庫上限（stock=10）までカートに追加
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 10 },
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('quantity-value')).toHaveText('10', { timeout: 0 });

    await page.getByTestId('quantity-increment').click();

    // 在庫不足エラートーストが表示される
    await expect(page.locator('text=在庫不足')).toBeVisible({ timeout: 5000 });
  });
});
