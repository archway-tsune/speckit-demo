/** カタログドメイン - 購入者導線E2Eテスト: 商品一覧・詳細閲覧・未ログイン時の動作を検証 */
import { test, expect } from '@playwright/test';
import { loginAsBuyer, resetForWorker } from '../helpers/login-helper';

test.describe('購入者導線 - カタログ', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsBuyer(page, wi);
  });

  test.describe('商品一覧', () => {
    test('商品一覧ページが表示される', async ({ page }) => {
      await page.goto('/sample/catalog');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 0 });
    });

    test('商品をクリックすると詳細ページに遷移する', async ({ page }) => {
      await page.goto('/sample/catalog');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="product-card"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/, { timeout: 0 });
    });
  });

  test.describe('商品詳細', () => {
    test('商品詳細が表示される', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible({ timeout: 0 });
      await expect(page.locator('text=¥')).toBeVisible({ timeout: 0 });
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
    });

    test('カートに追加できる', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="cart-count"]')).toContainText(/[1-9]/, { timeout: 0 });
    });
  });

  test.describe('未ログイン時の動作', () => {
    test('未ログインでもカタログページにアクセスできる', async ({ browser }) => {
      const newContext = await browser.newContext();
      const page = await newContext.newPage();
      await page.goto('/sample/catalog');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });
      await newContext.close();
    });

    test('未ログインでカート追加するとログインページにリダイレクトされる', async ({ browser }) => {
      const newContext = await browser.newContext();
      const page = await newContext.newPage();
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/login/, { timeout: 0 });
      await newContext.close();
    });
  });
});
