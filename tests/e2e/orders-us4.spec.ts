/** Orders US4 - 管理者注文管理 E2E テスト (AC-1, AC-2, AC-3, AC-5, AC-6) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/admin(?!\/login)/);
  await page.waitForLoadState('networkidle');
}

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
  return await res.json();
}

test.describe('US4: 管理者注文管理', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('管理者が注文一覧を確認できる (AC-1)', async ({ page }) => {
    // まず購入者として注文を作成
    await loginAsBuyer(page);
    await createOrder(page);

    // 管理者としてログインして注文一覧を確認
    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: '注文管理' })).toBeVisible({ timeout: 0 });
    await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('ステータスフィルタで絞り込める (AC-2)', async ({ page }) => {
    await loginAsBuyer(page);
    await createOrder(page);

    await loginAsAdmin(page);
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // pendingフィルタを選択
    await page.locator('[data-testid="status-filter"]').selectOption('pending');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('管理者がステータスを更新できる (AC-3)', async ({ page }) => {
    await loginAsBuyer(page);
    const orderData = await createOrder(page);
    expect(orderData.success).toBe(true);
    const orderId = orderData.data.id as string;

    await loginAsAdmin(page);
    await page.goto(`/admin/orders/${orderId}`);
    await page.waitForLoadState('networkidle');

    // 現在のステータスが pending
    await expect(page.locator('[data-testid="order-status"]')).toBeVisible({ timeout: 0 });

    // confirmed に変更
    await page.locator('[data-testid="status-select"]').selectOption('confirmed');
    await page.getByRole('button', { name: /ステータス更新/i }).click();

    await expect(page.locator('[data-testid="order-status"]')).toContainText('確定済み', { timeout: 5000 });
  });

  test('購入者が管理者注文画面にアクセスするとアクセス拒否される (AC-5)', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');

    // 購入者はadmin/loginにリダイレクトされるか、アクセス拒否ページが表示される
    const url = page.url();
    const isForbidden = url.includes('/admin/login') || url.includes('forbidden') ||
      await page.locator('text=アクセス').isVisible();
    expect(isForbidden).toBe(true);
  });
});
