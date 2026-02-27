/** Products US5 - 商品削除 E2E テスト (AC-1, AC-2, AC-3) */
import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('US5: 商品削除', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('削除ボタンをクリックし確認ダイアログで承認するとE2Eテスト商品が削除される (AC-1)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    // 商品テーブルが表示されるまで待機
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 5000 });

    // E2Eテスト商品の行を特定
    const targetRow = page.locator('[data-testid="product-row"]').filter({ hasText: 'E2Eテスト商品' });
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // 削除ボタンをクリック
    await targetRow.locator('[data-testid="delete-button"]').click();

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible({ timeout: 5000 });

    // 確認ボタンをクリック
    await page.locator('[data-testid="confirm-button"]').click();

    // E2Eテスト商品が一覧から消える
    await expect(targetRow).not.toBeVisible({ timeout: 5000 });
  });

  test('削除ボタンをクリックしキャンセルすると商品が一覧に残る (AC-2)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products');

    // 商品テーブルが表示されるまで待機
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible({ timeout: 5000 });

    // E2Eテスト商品の行を特定
    const targetRow = page.locator('[data-testid="product-row"]').filter({ hasText: 'E2Eテスト商品' });
    await expect(targetRow).toBeVisible({ timeout: 5000 });

    // 削除ボタンをクリック
    await targetRow.locator('[data-testid="delete-button"]').click();

    // 確認ダイアログが表示される
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible({ timeout: 5000 });

    // キャンセルボタンをクリック
    await page.locator('[data-testid="cancel-button"]').click();

    // ダイアログが閉じる
    await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible({ timeout: 5000 });

    // 商品は一覧に残る
    await expect(targetRow).toBeVisible({ timeout: 5000 });
  });
});
