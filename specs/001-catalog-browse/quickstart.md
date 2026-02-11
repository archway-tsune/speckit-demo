# クイックスタート: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-11

## 前提条件

- Node.js 18+
- pnpm インストール済み
- リポジトリのクローン済み

## セットアップ

```bash
# ブランチに切り替え
git checkout 001-catalog-browse

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev
```

## 動作確認

### 商品一覧（US1）

1. ブラウザで `http://localhost:3000/catalog` にアクセス
2. 商品カードが12件表示されることを確認
3. 各カードに商品画像・商品名・価格・在庫状況が表示されることを確認
4. 在庫切れ商品に「在庫切れ」ラベルが表示されることを確認
5. ページネーションで次ページに移動し、残りの商品が表示されることを確認

### 商品詳細（US2）

1. 商品一覧から任意の商品カードをクリック
2. 商品詳細ページで商品画像・商品名・価格・説明文・在庫数が表示されることを確認
3. 在庫あり商品でカート追加ボタンが有効であることを確認
4. 在庫切れ商品でカート追加ボタンが無効化されていることを確認

### 商品検索（US3）

1. 商品一覧ページの検索フォームにキーワードを入力
2. 検索結果に一致する商品のみが表示されることを確認
3. 該当なしの場合にメッセージが表示されることを確認
4. 検索条件をクリアして全商品一覧に戻ることを確認

## テスト実行

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト（ポート3000が空いていることを確認）
pnpm test:e2e

# カバレッジ確認
pnpm test:unit --coverage
```

## 主要ファイル

| カテゴリ | パス |
|---------|------|
| ユースケース | `src/domains/catalog/api/usecases.ts` |
| UI（一覧） | `src/domains/catalog/ui/ProductList.tsx` |
| UI（詳細） | `src/domains/catalog/ui/ProductDetail.tsx` |
| UI（カード） | `src/domains/catalog/ui/ProductCard.tsx` |
| コントラクト | `src/contracts/catalog.ts` |
| リポジトリ | `src/infrastructure/repositories/product.ts` |
| API Route | `src/app/api/catalog/products/route.ts` |
| ページ（一覧） | `src/app/(buyer)/catalog/page.tsx` |
| ページ（詳細） | `src/app/(buyer)/catalog/[id]/page.tsx` |
| 単体テスト | `tests/unit/domains/catalog/usecase.test.ts` |
| 統合テスト | `tests/integration/domains/catalog/api.test.ts` |
| E2Eテスト | `tests/e2e/catalog-browse.spec.ts` |
