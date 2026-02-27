/** Orders US1 - チェックアウトと注文確定 E2E テスト (AC-1, AC-2, AC-3, AC-4, AC-5) */
import { test, expect, type Page } from '@playwright/test';

const SEED_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001'; // ミニマルTシャツ, price=4980, stock=50

async function loginAsBuyer(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/catalog/);
}

test.describe('US1: チェックアウトと注文確定', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('カートに商品がある場合「注文手続きへ」リンクが表示され、注文確定フローが完結する (AC-1, AC-3, AC-4, AC-5)', async ({ page }) => {
    await loginAsBuyer(page);

    // カートに商品追加 (API経由)
    await page.request.post('/api/cart/items', {
      data: { productId: SEED_PRODUCT_ID, quantity: 2 },
    });

    // カートページで「注文手続きへ」リンクが表示される (AC-1)
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: /注文手続きへ/i })).toBeVisible({ timeout: 0 });

    // 「注文手続きへ」をクリックするとチェックアウトページに遷移する (AC-3)
    await page.getByRole('link', { name: /注文手続きへ/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/checkout/, { timeout: 0 });

    // チェックアウトページで「注文を確定」ボタンをクリック (AC-4)
    await page.getByRole('button', { name: /注文を確定/i }).click();

    // 注文完了：注文詳細ページにリダイレクトされ、お礼メッセージが表示される
    await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/, { timeout: 5000 });
    await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible({ timeout: 0 });

    // 注文後カートがクリアされる (AC-5)
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=カートに商品がありません')).toBeVisible({ timeout: 0 });
  });

  test('カートが空の場合「注文手続きへ」リンクは表示されない (AC-2)', async ({ page }) => {
    await loginAsBuyer(page);

    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: /注文手続きへ/i })).not.toBeVisible({ timeout: 0 });
  });
});
