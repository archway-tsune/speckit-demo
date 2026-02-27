/** Cart US5 - カート永続化 E2E テスト (AC-1, AC-2) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001'; // ミニマルTシャツ, stock=50

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

test.describe('US5: カート内容の永続化', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('別ページに遷移後にカートに戻っても商品が保持される (AC-1)', async ({ page }) => {
    await loginAsBuyer(page);

    // カートに商品追加
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 1 },
    });

    // カートページで商品確認
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('quantity-value')).toHaveText('1', { timeout: 0 });

    // 別ページへ遷移
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    // カートページに戻る
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // 商品が保持されている
    await expect(page.getByTestId('quantity-value')).toHaveText('1', { timeout: 5000 });
  });

  test('リロード後もカートの内容が保持される (AC-2)', async ({ page }) => {
    await loginAsBuyer(page);

    // カートに商品追加
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 2 },
    });

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('quantity-value')).toHaveText('2', { timeout: 0 });

    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // リロード後も保持されている
    await expect(page.getByTestId('quantity-value')).toHaveText('2', { timeout: 5000 });
  });
});
