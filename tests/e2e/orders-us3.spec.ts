/** Orders US3 - 注文詳細閲覧 E2E テスト (AC-1, AC-2) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001'; // ミニマルTシャツ

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

async function createOrder(page: Page) {
  await page.request.post('/api/cart/items', {
    data: { productId: SEED_PRODUCT_ID, quantity: 1 },
  });
  const res = await page.request.post('/api/orders', {
    data: { confirmed: true },
  });
  const data = await res.json();
  return data.data as { id: string };
}

test.describe('US3: 注文詳細閲覧', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('注文詳細ページに注文情報が表示される (AC-1)', async ({ page }) => {
    await loginAsBuyer(page);
    const order = await createOrder(page);

    await page.goto(`/orders/${order.id}`);
    await page.waitForLoadState('networkidle');

    // 注文詳細の見出し
    await expect(page.locator('h1')).toContainText('注文詳細', { timeout: 5000 });
    // ステータスが表示される
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible({ timeout: 0 });
  });

  test('存在しない注文IDにアクセスするとエラーが表示される (AC-2)', async ({ page }) => {
    await loginAsBuyer(page);

    await page.goto('/orders/550e8400-e29b-41d4-a716-000000000000');
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示される（NotFoundError → DataView error state）
    await expect(page.locator('text=注文が見つかりません').or(page.locator('[data-testid="error-message"]'))).toBeVisible({ timeout: 5000 });
  });
});
