# クイックスタート: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **作成日**: 2026-02-27

## 前提条件

```bash
node --version   # v18以上
pnpm --version   # v8以上
```

## セットアップ

```bash
# 依存関係インストール（初回のみ）
pnpm install

# ビルドスクリプト承認（初回のみ）
pnpm approve-builds
```

## 開発サーバー起動

```bash
pnpm dev   # http://localhost:3000
```

## 動作確認手順

### US1: 商品一覧

1. `http://localhost:3000/catalog` にアクセス（ログイン不要）
2. 商品カード（画像・名称・価格）が 12件表示されることを確認
3. ページネーション「次へ」ボタンをクリックし、残り 3件が表示されることを確認
4. 在庫切れ商品（デニムパンツ・キャップ）に「在庫切れ」バッジが表示されることを確認

### US2: 商品詳細

1. 商品一覧から任意の商品をクリック
2. 商品画像・名称・価格・説明文・在庫数が表示されることを確認
3. 在庫切れ商品（stock=0）の詳細画面でカート追加ボタンが無効化されていることを確認
4. `http://localhost:3000/catalog/550e8400-e29b-41d4-a716-44665544000d`（腕時計）にアクセスし、プレースホルダー画像が表示されることを確認
5. 「一覧に戻る」ボタンで商品一覧に戻れることを確認

### US3: 商品検索

1. 商品一覧画面の検索バーにキーワードを入力して Enter
2. 商品名・説明文に一致する商品のみ表示されることを確認
3. 検索クリアボタン（×）で全商品一覧に戻ることを確認
4. 存在しないキーワードで「該当する商品が見つかりませんでした」が表示されることを確認

## テスト実行

```bash
# 単体・統合テスト
pnpm test:unit
pnpm test:integration

# E2Eテスト（別ターミナルでサーバー起動が必要）
pnpm dev:test   # ポート 3099 で起動
pnpm test:e2e -- tests/e2e/catalog-us1.spec.ts
pnpm test:e2e -- tests/e2e/catalog-us2.spec.ts
pnpm test:e2e -- tests/e2e/catalog-us3.spec.ts
```

## 実装状態リセット（テストデータ再投入）

```bash
curl -X POST http://localhost:3000/api/test/reset
```

## API 動作確認

```bash
# 商品一覧（12件/ページ）
curl "http://localhost:3000/api/catalog/products?page=1&limit=12" | jq .

# 商品一覧（2ページ目）
curl "http://localhost:3000/api/catalog/products?page=2&limit=12" | jq .

# キーワード検索
curl "http://localhost:3000/api/catalog/products?q=ウール&limit=12" | jq .

# 商品詳細
curl "http://localhost:3000/api/catalog/products/550e8400-e29b-41d4-a716-446655440001" | jq .
```
