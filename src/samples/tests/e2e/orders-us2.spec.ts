/** 注文ドメイン - 管理者導線E2Eテスト: 注文一覧・詳細・ステータス更新を検証 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsBuyer, resetForWorker } from '../helpers/login-helper';

async function createOrderAsBuyer(page: import('@playwright/test').Page, wi: number) {
  await loginAsBuyer(page, wi);
  await page.goto('/sample/catalog');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });
  await page.locator('[data-testid="product-card"]').first().click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/, { timeout: 0 });
  await page.getByRole('button', { name: /カートに追加/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 0 });
  await page.goto('/sample/cart');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('カート', { timeout: 0 });
  await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 0 });
  await page.getByRole('button', { name: /注文手続きへ/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/sample\/checkout/, { timeout: 0 });
  await page.getByRole('button', { name: /注文を確定/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/sample\/orders\//, { timeout: 0 });
}

test.describe('管理者導線 - 注文', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsAdmin(page, wi);
  });

  test.describe('注文管理', () => {
    test('注文一覧が表示される', async ({ page }) => {
      const wi = test.info().parallelIndex;
      await createOrderAsBuyer(page, wi);
      await loginAsAdmin(page, wi);
      await page.goto('/sample/admin/orders');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible({ timeout: 0 });
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 0 });
    });

    test('注文詳細を確認できる', async ({ page }) => {
      const wi = test.info().parallelIndex;
      await createOrderAsBuyer(page, wi);
      await loginAsAdmin(page, wi);
      await page.goto('/sample/admin/orders');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="order-row"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main h1')).toContainText('注文詳細', { timeout: 0 });
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible({ timeout: 0 });
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible({ timeout: 0 });
    });

    test('注文ステータスを更新できる', async ({ page }) => {
      const wi = test.info().parallelIndex;
      await createOrderAsBuyer(page, wi);
      await loginAsAdmin(page, wi);
      await page.goto('/sample/admin/orders');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="order-row"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="status-select"]')).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="status-select"]').selectOption('confirmed');
      await page.getByRole('button', { name: /ステータス更新/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=ステータスを更新しました')).toBeVisible({ timeout: 0 });
    });

    test('ステータスフィルタで絞り込める', async ({ page }) => {
      const wi = test.info().parallelIndex;
      await createOrderAsBuyer(page, wi);
      await loginAsAdmin(page, wi);
      await page.goto('/sample/admin/orders');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="status-filter"]').selectOption('pending');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="order-status"]').first()).toContainText('処理待ち', { timeout: 0 });
    });
  });
});
