/** Products US2 - 商品新規登録 E2E テスト (AC-1, AC-2, AC-7) */
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

test.describe('US2: 商品新規登録', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('商品名と価格を入力して送信すると draft で作成され一覧に遷移する (AC-1)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');
    // ProductForm がクラッシュする場合は networkidle がタイムアウトする可能性があるため短めに設定
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
    await page.locator('#name').fill('テスト新商品');
    await page.locator('#price').fill('3000');
    await page.getByRole('button', { name: /登録|保存|作成/i }).click();

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 5000 });
  });

  test('商品名が空欄でフォームを送信するとバリデーションエラーが表示される (AC-2)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.locator('#price')).toBeVisible({ timeout: 0 });
    await page.locator('#price').fill('3000');
    await page.getByRole('button', { name: /登録|保存|作成/i }).click();

    await expect(page.getByText(/商品名を入力/i)).toBeVisible({ timeout: 5000 });
  });

  test('キャンセルをクリックすると商品一覧に遷移する (AC-7)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.getByRole('button', { name: /キャンセル/i })).toBeVisible({ timeout: 0 });
    await page.getByRole('button', { name: /キャンセル/i }).click();

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 5000 });
  });
});
