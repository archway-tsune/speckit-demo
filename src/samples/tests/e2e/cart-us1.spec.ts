/** カートドメイン - 購入者導線E2Eテスト: カート操作（表示・空状態・数量変更・注文手続き）を検証 */
import { test, expect } from '@playwright/test';
import { loginAsBuyer, resetForWorker } from '../helpers/login-helper';

test.describe('購入者導線 - カート', () => {
  test.beforeEach(async ({ page, request }) => {
    const wi = test.info().parallelIndex;
    await resetForWorker(request, wi);
    await loginAsBuyer(page, wi);
  });

  test.describe('カート', () => {
    test('カートページが表示される', async ({ page }) => {
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('カート', { timeout: 0 });
    });

    test('カートが空の場合は空状態を表示する', async ({ page }) => {
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=カートは空です')).toBeVisible({ timeout: 0 });
    });

    test('カートに追加するとトースト通知が表示される', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 0 });
    });

    test('カート内商品の数量をQuantitySelectorで変更できる', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 0 });
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('カート', { timeout: 0 });
      await expect(page.locator('[data-testid="quantity-value"]').first()).toBeVisible({ timeout: 0 });
      await expect(page.locator('[data-testid="quantity-value"]').first()).toHaveText('1', { timeout: 0 });
      await page.locator('[data-testid="quantity-increment"]').first().click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="quantity-value"]').first()).toHaveText('2', { timeout: 0 });
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 0 });
    });

    test('削除ボタンでConfirmDialogが表示され確認で削除される', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible({ timeout: 0 });
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('カート', { timeout: 0 });
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /を削除/i }).first().click();
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('text=この商品をカートから削除しますか？')).toBeVisible();
      await page.locator('[data-testid="confirm-button"]').click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=カートは空です')).toBeVisible({ timeout: 0 });
    });

    test('空カートで「買い物を続ける」をクリックするとカタログに遷移する', async ({ page }) => {
      await page.goto('/sample/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=カートは空です')).toBeVisible({ timeout: 0 });
      await page.getByRole('button', { name: /買い物を続ける/i }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/sample\/catalog/, { timeout: 0 });
    });

    test('注文手続きに進める', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible({ timeout: 0 });
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
    });

    test('draft商品をAPIで直接カート追加するとエラーになる', async ({ page }) => {
      const draftProductId = '550e8400-e29b-41d4-a716-446655440005';
      const response = await page.request.post('/sample/api/cart/items', {
        data: { productId: draftProductId, quantity: 1 },
      });
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('商品が見つかりません');
    });
  });
});
