/** Products US3 - 商品編集 E2E テスト (AC-1, AC-2, AC-5) */
import { test, expect, type Page } from '@playwright/test';

const E2E_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('US3: 商品編集', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('編集ページを開くと既存データがプリロードされている (AC-1)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/products/${E2E_PRODUCT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
    const nameValue = await page.locator('#name').inputValue();
    expect(nameValue).toBe('E2Eテスト商品');
  });

  test('商品名を変更して保存すると商品一覧に遷移する (AC-2)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/products/${E2E_PRODUCT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.locator('#name')).toBeVisible({ timeout: 0 });
    await page.locator('#name').fill('編集後テスト商品');
    await page.getByRole('button', { name: /保存|更新|登録/i }).click();

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 5000 });
  });

  test('キャンセルをクリックすると商品一覧に遷移する (AC-5)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/admin/products/${E2E_PRODUCT_ID}/edit`);
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    await expect(page.getByRole('button', { name: /キャンセル/i })).toBeVisible({ timeout: 0 });
    await page.getByRole('button', { name: /キャンセル/i }).click();

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 5000 });
  });
});
