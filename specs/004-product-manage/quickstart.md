# クイックスタート: 商品管理機能

**作成日**: 2026-02-27
**対応フィーチャー**: `004-product-manage`

---

## 前提条件

- dev server 起動: `pnpm dev:test`（Playwright 用ポート 3099）
- 管理者アカウント: `admin@example.com` / `admin123`
- 購入者アカウント: `buyer@example.com` / `buyer123`
- シードデータ: 16商品（15 published + 1 draft）が初期投入済み

---

## テストシナリオ一覧

### US1: 商品一覧表示

**シナリオ 1-a**: 管理者が `/admin/products` にアクセスし全商品（全ステータス含む）をテーブル形式で確認

```
Given: 管理者でログイン済み
When:  /admin/products にアクセス
Then:  商品テーブルが表示される（商品名・価格・在庫数・ステータス・編集リンク・削除ボタン）
And:   「非公開ドラフト商品」（draft ステータス）も表示される
And:   「新規登録」ボタンが表示される
```

**シナリオ 1-b**: 購入者が管理画面にアクセスしようとした場合

```
Given: 購入者でログイン済み
When:  /admin/products にアクセス
Then:  403 Forbidden（アクセス拒否）
```

**シナリオ 1-c**: 未ログイン状態

```
Given: 未ログイン
When:  /admin/products にアクセス
Then:  /admin/login（管理者ログインページ）にリダイレクト
```

---

### US2: 商品新規登録

**シナリオ 2-a**: 必須項目のみで商品を登録

```
Given: 管理者が /admin/products/new にアクセス（または「新規登録」ボタンをクリック）
When:  商品名「テスト商品」・価格「1000」を入力して送信
Then:  draft ステータスで商品が作成される
And:   /admin/products に遷移する
And:   一覧に「テスト商品」が表示される
```

**シナリオ 2-b**: バリデーションエラー（商品名なし）

```
Given: 管理者が登録フォームを表示中
When:  商品名を空のまま価格のみ入力して送信
Then:  バリデーションエラーが表示される
And:   フォームページのまま（遷移しない）
```

**シナリオ 2-c**: キャンセル

```
Given: 管理者が /admin/products/new を表示中
When:  「キャンセル」をクリック
Then:  /admin/products に遷移する
```

---

### US3: 商品編集

**シナリオ 3-a**: 既存商品を編集

```
Given: 管理者が商品一覧の「編集」リンクをクリック（/admin/products/[id]/edit）
When:  編集ページが表示される
Then:  全フィールドに既存データがプリロードされている
When:  商品名を変更して保存
Then:  変更が反映され /admin/products に遷移する
```

**シナリオ 3-b**: 存在しない商品 ID

```
Given: /admin/products/invalid-uuid/edit にアクセス
Then:  404 エラーが表示される
```

---

### US4: ステータス変更（inline）

**シナリオ 4-a**: ドロップダウンからステータスを即時変更

```
Given: 管理者が /admin/products を表示中
When:  任意の商品のドロップダウンで「公開中」を選択
Then:  ページリロードなしで即座にステータスが「公開中」に変更される
And:   表示されるステータスバッジが更新される
```

---

### US5: 商品削除

**シナリオ 5-a**: 確認ダイアログを経て削除

```
Given: 管理者が /admin/products を表示中
When:  任意の商品の「削除」ボタンをクリック
Then:  確認ダイアログが表示される
When:  ダイアログで「確認」をクリック
Then:  商品が削除され一覧から消える
```

**シナリオ 5-b**: 削除をキャンセル

```
Given: 確認ダイアログが表示中
When:  「キャンセル」をクリック
Then:  ダイアログが閉じる
And:   商品は削除されず一覧に残る
```

---

## テスト用シードデータ

| ID | 商品名 | 価格 | 在庫 | ステータス |
|----|--------|------|------|------------|
| `550e8400-...-440000` | E2Eテスト商品 | 3,000 | 10 | published |
| `550e8400-...-440001` | ミニマルTシャツ | 4,980 | 50 | published |
| `550e8400-...-44000f` | 非公開ドラフト商品 | 9,999 | 0 | draft |
| （他 13 件） | — | — | — | published |

---

## テスト実行コマンド

```bash
# 単体テスト（products ドメイン）
pnpm test:unit:only tests/unit/domains/products/

# 統合テスト（products ドメイン）
pnpm test:integration:only tests/integration/domains/products/

# E2E テスト（US 個別）
pnpm test:e2e --retries 0 tests/e2e/products-us1.spec.ts
pnpm test:e2e --retries 0 tests/e2e/products-us2.spec.ts
pnpm test:e2e --retries 0 tests/e2e/products-us3.spec.ts
pnpm test:e2e --retries 0 tests/e2e/products-us4.spec.ts
pnpm test:e2e --retries 0 tests/e2e/products-us5.spec.ts
```
