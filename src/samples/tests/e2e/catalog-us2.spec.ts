/** カタログドメイン - 管理者導線E2Eテスト: 商品CRUD・ステータス管理・権限確認を検証 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsBuyer, resetForWorker } from '../helpers/login-helper';

test.describe('管理者導線 - カタログ', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsAdmin(page, wi);
  });

  test.describe('商品管理', () => {
    test('商品一覧が表示される', async ({ page }) => {
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('table')).toBeVisible({ timeout: 0 });
      await expect(page.getByRole('link', { name: /新規登録/i })).toBeVisible({ timeout: 0 });
    });

    test('商品を新規登録できる', async ({ page }) => {
      await page.goto('/sample/admin/products/new');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
      await page.locator('#name').fill('テスト商品');
      await page.locator('#price').fill('1000');
      await page.locator('#description').fill('テスト商品の説明です');
      await page.getByRole('button', { name: /登録/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/products/, { timeout: 0 });
    });

    test('商品を編集できる', async ({ page }) => {
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="edit-button"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="edit-button"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/products\/.*\/edit/, { timeout: 0 });
      await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
      await page.locator('#name').clear();
      await page.locator('#name').fill('編集後商品名');
      await page.getByRole('button', { name: /保存/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/products$/, { timeout: 0 });
    });

    test('商品を削除できる', async ({ page }) => {
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 0 });
      const initialCount = await page.locator('[data-testid="product-row"]').count();
      await page.locator('[data-testid="delete-button"]').first().click();
      await expect(page.getByRole('button', { name: /削除する/i })).toBeVisible({ timeout: 1000 });
      await page.getByRole('button', { name: /削除する/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="product-row"]')).toHaveCount(initialCount - 1, { timeout: 0 });
    });

    test('商品ステータスを変更できる', async ({ page }) => {
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 0 });
      await page.locator('[data-testid="status-select"]').first().selectOption('published');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="status-badge"]').first()).toContainText('公開中', { timeout: 0 });
    });
  });

  test.describe('一連の管理フロー', () => {
    test('商品登録 → 公開', async ({ page }) => {
      await page.goto('/sample/admin/products/new');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
      await page.locator('#name').fill('管理フローテスト商品');
      await page.locator('#price').fill('5000');
      await page.getByRole('button', { name: /登録/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/products/, { timeout: 0 });
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=管理フローテスト商品').first()).toBeVisible({ timeout: 0 });
      const lastRow = page.locator('[data-testid="product-row"]').last();
      await lastRow.locator('[data-testid="status-select"]').selectOption('published');
      await page.waitForLoadState('networkidle');
      await expect(lastRow.locator('[data-testid="status-badge"]')).toContainText('公開中', { timeout: 0 });
    });
  });

  test.describe('権限確認', () => {
    test('未認証ユーザーは管理画面にアクセスできない', async ({ browser }) => {
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      await newPage.goto('/sample/admin/products');
      await newPage.waitForLoadState('networkidle');
      await expect(newPage).toHaveURL(/\/sample\/admin\/login/, { timeout: 0 });
      await newContext.close();
    });

    test('buyerロールは管理画面にアクセスできない', async ({ browser }) => {
      const wi = test.info().parallelIndex;
      const buyerContext = await browser.newContext();
      const page = await buyerContext.newPage();
      await loginAsBuyer(page, wi);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=購入者テスト')).toBeVisible({ timeout: 0 });
      await page.goto('/sample/admin/products');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/admin\/login/, { timeout: 0 });
      await buyerContext.close();
    });

    test('adminロールは購入者専用ページにアクセスできない', async ({ page }) => {
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/forbidden/, { timeout: 0 });
      await expect(page.locator('text=権限がありません')).toBeVisible({ timeout: 0 });
    });

    test('adminロールはカタログページにアクセスできる', async ({ page }) => {
      await page.goto('/sample/catalog');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('商品', { timeout: 0 });
    });

    test('adminロールはカタログでカート追加ボタンが表示されない', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible({ timeout: 0 });
      await expect(page.getByRole('button', { name: /カートに追加/i })).not.toBeVisible();
    });
  });
});
