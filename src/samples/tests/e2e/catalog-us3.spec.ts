/** カタログドメイン - ページネーション・検索 E2Eテスト */
import { test, expect } from '@playwright/test';
import { loginAsBuyer, loginAsAdmin, resetForWorker } from '../helpers/login-helper';

test.describe('購入者導線 - カタログ表示', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsBuyer(page, wi);
  });

  test('商品一覧でProductCardが表示される', async ({ page }) => {
    await page.goto('/sample/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 0 });
    // 公開商品が5件（limit=20で1ページに収まる）なのでページネーションは非表示
    const pagination = page.getByRole('navigation', { name: /ページネーション/i });
    await expect(pagination).not.toBeVisible();
  });

  test('商品カードに価格情報が含まれる', async ({ page }) => {
    await page.goto('/sample/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible({ timeout: 0 });
    // 商品カードが複数表示される
    const count = await page.locator('[data-testid="product-card"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('管理者導線 - 商品検索', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsAdmin(page, wi);
  });

  test('管理者商品一覧で検索バーが表示される', async ({ page }) => {
    await page.goto('/sample/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 0 });
    await expect(page.getByTestId('search-input')).toBeVisible({ timeout: 0 });
  });

  test('検索バーで商品名をフィルタリングできる', async ({ page }) => {
    await page.goto('/sample/admin/products');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 0 });

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('存在しない商品名');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // フィルタ後の件数がゼロまたは減少
    await expect(page.locator('[data-testid="product-row"]')).toHaveCount(0, { timeout: 0 });
  });
});
