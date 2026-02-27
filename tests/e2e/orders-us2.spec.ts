/** Orders US2 - 注文履歴閲覧 E2E テスト (AC-1, AC-3) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001'; // ミニマルTシャツ, price=4980, stock=50

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

async function createOrderViaBrowser(page: Page) {
  // カートに商品追加
  await page.request.post('/api/cart/items', {
    data: { productId: SEED_PRODUCT_ID, quantity: 1 },
  });
  // チェックアウトで注文確定
  const res = await page.request.post('/api/orders', {
    data: { confirmed: true },
  });
  return await res.json();
}

test.describe('US2: 注文履歴閲覧', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('注文一覧に order-row が表示され、クリックで詳細ページに遷移する (AC-1, AC-3)', async ({ page }) => {
    await loginAsBuyer(page);

    // 注文を作成
    const orderData = await createOrderViaBrowser(page);
    expect(orderData.success).toBe(true);

    // 注文一覧ページを開く
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('注文履歴', { timeout: 0 });

    // 注文行が表示される (AC-1)
    await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 5000 });

    // 注文行をクリックすると詳細ページに遷移する (AC-3)
    await page.locator('[data-testid="order-row"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/, { timeout: 5000 });
  });

  test('注文がない場合は空メッセージが表示される', async ({ page }) => {
    await loginAsBuyer(page);

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=注文履歴がありません')).toBeVisible({ timeout: 5000 });
  });
});
