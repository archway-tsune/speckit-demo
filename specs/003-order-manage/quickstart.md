# クイックスタート: 注文機能テストシナリオ

## シードデータ

```
buyer@example.com / demo   → role: buyer, userId: (シードID)
admin@example.com / demo   → role: admin
商品: ミニマルTシャツ (ID: 550e8400-e29b-41d4-a716-446655440001, price: 4980, stock: 50)
商品: E2Eテスト商品 (ID: 550e8400-e29b-41d4-a716-446655440000, price: 3000, stock: 10)
```

## E2E シナリオ

### シナリオ 1: 注文確定フロー (US1)

```typescript
// 1. buyer ログイン
// 2. API でカートに商品追加
await page.request.post('/api/cart/items', { data: { productId: PRODUCT_ID, quantity: 2 } });
// 3. カートページ → 「注文手続きへ」ボタン確認
await page.goto('/cart');
await expect(page.getByRole('link', { name: /注文手続きへ/ })).toBeVisible();
// 4. チェックアウトページ遷移 → 注文内容確認
await page.goto('/checkout');
await expect(page.getByTestId('cart-subtotal')).toHaveText('¥9,960');
await expect(page.getByTestId('checkout-tax')).toHaveText('¥996');
await expect(page.getByTestId('checkout-total')).toHaveText('¥10,956');
// 5. 注文を確定
await page.getByRole('button', { name: /注文を確定/ }).click();
// 6. 注文完了ページ確認
await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible({ timeout: 5000 });
await expect(page.getByTestId('order-id')).toBeVisible();
// 7. カートが空になった確認
await page.goto('/cart');
await expect(page.locator('text=カートに商品がありません')).toBeVisible();
```

### シナリオ 2: 空カートでの注文手続きボタン非表示 (US1 AC-2)

```typescript
// カートが空 → 「注文手続きへ」ボタン非表示
await page.goto('/cart');
await expect(page.getByRole('link', { name: /注文手続きへ/ })).not.toBeVisible();
```

### シナリオ 3: 注文履歴一覧 (US2)

```typescript
// buyer でログイン・注文作成後
await page.goto('/orders');
await page.waitForLoadState('networkidle');
await expect(page.getByTestId('order-row')).toBeVisible({ timeout: 5000 });
// 注文をクリック → 詳細ページへ
await page.getByTestId('order-row').first().click();
await expect(page.url()).toMatch(/\/orders\//);
```

### シナリオ 4: 注文詳細 (US3)

```typescript
// 自分の注文詳細
await page.goto(`/orders/${orderId}`);
await expect(page.getByTestId('order-status')).toBeVisible({ timeout: 5000 });
// 他人の注文へのアクセス
await page.goto(`/orders/${otherUsersOrderId}`);
await expect(page.locator('text=404').or(page.locator('text=見つかりません'))).toBeVisible({ timeout: 5000 });
```

### シナリオ 5: 管理者ステータス更新 (US4)

```typescript
// admin ログイン
await page.goto('/admin/orders');
await page.getByTestId('order-row').first().click();
// ステータス更新
await page.getByTestId('status-select').selectOption('confirmed');
await page.getByRole('button', { name: /ステータス更新/ }).click();
await expect(page.getByTestId('order-status')).toContainText('確認済み', { timeout: 5000 });
// 無効遷移: delivered→confirmed はセレクトに表示されない
```

### シナリオ 6: アクセス制御 (US5)

```typescript
// 未ログインでチェックアウトページにアクセス
await page.goto('/checkout');
await expect(page.url()).toMatch(/\/login/);
// buyer が管理者ページにアクセス → forbidden
// (AdminLayout が /forbidden にリダイレクト)
```

## 消費税計算の検証例

| subtotal | tax (floor × 0.1) | totalAmount |
|----------|-------------------|-------------|
| 9,960 | 996 | 10,956 |
| 4,980 | 498 | 5,478 |
| 3,000 | 300 | 3,300 |
| 333 | 33 (333×0.1=33.3→切り捨て) | 366 |
