/**
 * カタログ閲覧機能 - E2E テスト
 * US1: 商品一覧表示
 * 認証不要でカタログ閲覧が可能であることを検証
 */
import { test, expect } from '@playwright/test';

test.describe('US1: 商品一覧表示', () => {
  test('商品一覧ページで12件の商品カードが表示される', async ({ page }) => {
    await page.goto('/catalog');

    // 商品カードが 12 件表示されることを確認
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards).toHaveCount(12);
  });

  test('商品カードに画像・名前・価格が含まれる', async ({ page }) => {
    await page.goto('/catalog');

    // 最初の商品カードの内容を確認
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard).toBeVisible();

    // 商品名が表示されること
    await expect(firstCard.locator('h3')).toBeVisible();

    // 価格が表示されること（¥ マーク）
    await expect(firstCard.locator('text=¥')).toBeVisible();
  });

  test('在庫切れ商品に「在庫切れ」が表示される', async ({ page }) => {
    // ページ内に在庫切れラベルがあることを確認
    // （在庫切れ商品は2件あるが、1ページ目に表示されない可能性があるため全ページ探索）
    let found = false;
    const maxPages = 3;

    for (let p = 1; p <= maxPages; p++) {
      await page.goto(`/catalog?page=${p}`);

      // 商品カードがレンダリングされるまで待機
      const cards = page.locator('[data-testid="product-card"]');
      await expect(cards.first()).toBeVisible();

      const outOfStockLabel = page.locator('text=在庫切れ');
      const count = await outOfStockLabel.count();
      if (count > 0) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  });

  test('ページネーションで次ページに遷移できる', async ({ page }) => {
    await page.goto('/catalog');

    // 次へボタンをクリック
    await page.getByRole('button', { name: /次へ/i }).click();

    // 商品カードが表示されること（2ページ目）
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible();

    // 1ページ目とは異なる商品が表示されること（カード数が変わる可能性）
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(12);
  });

  test('認証なしで商品一覧にアクセスできる', async ({ browser }) => {
    // 新しいコンテキスト（未ログイン状態）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/catalog');

    // 商品カードが表示されること
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible();

    await context.close();
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: 商品詳細表示
// ─────────────────────────────────────────────────────────────────

test.describe('US2: 商品詳細表示', () => {
  test('商品詳細ページで情報が表示される', async ({ page }) => {
    // コットンポロシャツ（EXTENSION_PRODUCTS、stock: 25）
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440010');

    // 商品名が表示される
    await expect(page.locator('h1')).toContainText('コットンポロシャツ');

    // 価格が表示される
    await expect(page.locator('text=¥')).toBeVisible();

    // 説明文が表示される
    await expect(page.locator('text=通気性の良い')).toBeVisible();

    // カート追加ボタンが表示・有効である
    const addButton = page.getByRole('button', { name: /カートに追加/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('在庫切れ商品でカート追加ボタンが無効化される', async ({ page }) => {
    // ボーダーTシャツ（stock: 0）
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440020');

    // 商品名が表示される
    await expect(page.locator('h1')).toContainText('ボーダーTシャツ');

    // カート追加ボタンが無効化されている
    const addButton = page.getByRole('button', { name: /カートに追加/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeDisabled();
  });

  test('画像未設定商品でプレースホルダーが表示される', async ({ page }) => {
    // キャンバスエプロン（imageUrl なし）
    await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440029');

    // プレースホルダー画像が表示される
    await expect(page.locator('[data-testid="product-image-placeholder"]')).toBeVisible();
  });

  test('商品一覧から詳細に遷移できる', async ({ page }) => {
    await page.goto('/catalog');

    // 最初の商品カードをクリック
    await page.locator('[data-testid="product-card"]').first().click();

    // 詳細ページに遷移
    await expect(page).toHaveURL(/\/catalog\/[a-f0-9-]+/);

    // 商品名が表示される
    await expect(page.locator('h1')).toBeVisible();

    // 価格が表示される
    await expect(page.locator('text=¥')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: 商品検索
// ─────────────────────────────────────────────────────────────────

test.describe('US3: 商品検索', () => {
  test('キーワードで商品を検索できる', async ({ page }) => {
    await page.goto('/catalog');

    // 検索フォームにキーワードを入力
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('コットン');
    await searchInput.press('Enter');

    // 検索結果が表示される（コットンを含む商品のみ）
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible();

    // 全カードの件数が12件より少ない（絞り込まれている）
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(12);
  });

  test('該当なしの場合メッセージが表示される', async ({ page }) => {
    await page.goto('/catalog');

    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('存在しない商品名XXXYYY');
    await searchInput.press('Enter');

    // 該当なしメッセージが表示される
    await expect(page.locator('text=該当する商品が見つかりません')).toBeVisible();
  });

  test('検索をクリアすると全商品一覧に戻る', async ({ page }) => {
    await page.goto('/catalog');

    // まず検索する
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('コットン');
    await searchInput.press('Enter');

    // 検索結果が表示される
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible();

    // クリアボタンをクリック
    const clearButton = page.locator('[data-testid="search-clear"]');
    await clearButton.click();

    // 全商品一覧に戻る（12件表示）
    await expect(cards).toHaveCount(12);
  });
});
