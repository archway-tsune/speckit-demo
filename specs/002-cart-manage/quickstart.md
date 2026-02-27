# クイックスタート: カート管理機能 (002-cart-manage)

**Phase 1 完了日**: 2026-02-27

---

## 実装完了後の統合シナリオ

### 前提条件

- シードデータ: buyer ユーザー（login: buyer@example.com）が利用可能
- 商品（published, stock > 0）が catalog に存在
- dev サーバー: `pnpm dev:test` (http://localhost:3099)

---

## シナリオ 1: 商品をカートに追加する

```
1. /login で buyer@example.com としてログイン
2. /catalog でランダムな published 商品を選択
3. 商品詳細ページ（/catalog/[id]）で「カートに追加」ボタンをクリック
4. 期待: トーストメッセージ「カートに追加しました」が表示される
5. 期待: ヘッダーのカートアイコンに 1 が表示される
6. 同じ商品の「カートに追加」ボタンをクリック
7. 期待: ヘッダーのカートアイコンに 2 が表示される（マージ）
```

---

## シナリオ 2: カートの内容を確認する

```
1. buyer としてログイン
2. 複数商品をカートに追加
3. /cart を開く
4. 期待: 商品名・単価・数量・小計が一覧表示
5. 期待: 商品合計・消費税（10%, 端数切り捨て）・総合計が正しく表示
6. 例: 商品合計 9,960円 → 消費税 996円 → 総合計 10,956円
```

---

## シナリオ 3: 数量を変更する

```
1. /cart でカート内商品の + ボタンをクリック
2. 期待: quantity が増加し、小計と合計金額が即時更新される
3. quantity が stock に達した状態で + をクリック
4. 期待: + ボタンが disabled になる（QuantitySelector の max=stock）
```

---

## シナリオ 4: 商品を削除する

```
1. /cart で削除ボタン（ゴミ箱アイコン）をクリック
2. 期待: 確認ダイアログ「この商品をカートから削除しますか？」が表示される
3. 「削除する」ボタンをクリック
4. 期待: 商品がカートから除外され、合計金額が更新される
5. 最後の1件を削除
6. 期待: 「カートに商品がありません」メッセージが表示される
```

---

## シナリオ 5: カート内容の永続化

```
1. buyer としてログインしてカートに商品を追加
2. /catalog など別ページに遷移
3. /cart に戻る
4. 期待: 追加した商品がカートに残っている
5. ページをリロード（F5）
6. 期待: カート内容が保持されている
```

---

## シナリオ 6: 未ログイン時のリダイレクト

```
1. ログアウト状態で /catalog/[id] を開く
2. 「カートに追加」ボタンをクリック
3. 期待: /login?callbackUrl=/catalog/[id] にリダイレクト
4. ログイン
5. 期待: 元の商品詳細ページ /catalog/[id] に戻る
```

---

## テストコマンド

```bash
# 単体テスト
pnpm test:unit:only tests/unit/domains/cart/

# 統合テスト
pnpm test:integration:only tests/integration/domains/cart/

# E2Eテスト（US 指定）
pnpm test:e2e tests/e2e/cart-us1.spec.ts

# 全E2E
pnpm test:e2e
```

---

## 重要な実装ポイント

### 在庫チェックのタイミング
- `addToCart`: `カート内数量 + quantity > product.stock` → 422
- `updateCartItem`: `quantity > product.stock` → 422
- QuantitySelector の `max` prop に `product.stock` と `99` の小さい方を渡す

### emitCartUpdated の呼び出し
```typescript
import { emitCartUpdated } from '@/components';
// カート変更成功後に呼び出す
emitCartUpdated();
```

### 消費税計算（CartView 内）
```typescript
const tax = Math.floor(cart.subtotal * 0.1);
const total = cart.subtotal + tax;
```

### ConfirmDialog の使用パターン（削除確認）
```tsx
const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

<ConfirmDialog
  open={pendingRemoveId !== null}
  message="この商品をカートから削除しますか？"
  confirmLabel="削除する"
  variant="danger"
  onConfirm={() => { onRemove?.(pendingRemoveId!); setPendingRemoveId(null); }}
  onCancel={() => setPendingRemoveId(null)}
/>
```
