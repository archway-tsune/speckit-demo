# リサーチ: カタログ閲覧機能

**ブランチ**: `001-catalog-browse` | **日付**: 2026-02-11

## 調査 1: 既存コントラクトと仕様要件のギャップ

### 判断: コントラクト拡張が必要

**根拠**: `src/contracts/catalog.ts` の `ProductSchema` に `stock`（在庫数）フィールドが
存在しない。spec.md は在庫数の表示（FR-006）、在庫切れ表示（FR-004）、カート追加ボタンの
無効化（FR-008）を要求しており、在庫数フィールドは必須。

**追加フィールド**:
- `stock: z.number().int().min(0).default(0)` — `.default(0)` によりサンプルコード互換性を維持

**検討した代替案**:
- `status` フィールドで在庫切れを表現 → 在庫「数」の表示要件を満たせないため却下
- 別テーブル（Inventory）に分離 → スコープ過大。インメモリストアでは不要

---

## 調査 2: 検索機能の実装アプローチ

### 判断: `keyword` パラメータをコントラクトに追加

**根拠**: spec.md FR-010 はキーワード検索（商品名・説明文）を要求。
既存の `GetProductsInputSchema` には検索パラメータがない。

**追加パラメータ**:
- `GetProductsInputSchema` に `keyword: z.string().optional()` を追加
- `ProductRepository.findAll` の `params` に `keyword?: string` を追加（オプショナル）

**検索ロジック**: インメモリストアで `name` と `description` を部分一致検索（大文字小文字無視）。
サーバーサイドフィルタリングとし、API レスポンスのページネーションに反映。

**検討した代替案**:
- クライアントサイドフィルタリング → 全件取得が必要でページネーションと矛盾。却下
- 全文検索エンジン（Elasticsearch 等）→ インメモリストアではオーバースペック。却下

---

## 調査 3: ページネーションの仕様

### 判断: 既存の `limit` パラメータを活用（デフォルト 12 に設定）

**根拠**: 既存コントラクトの `limit` は `default(20)` だが、spec.md FR-002 は
1ページ12件を要求。コントラクトの `default(20)` はサンプル互換のため変更しない。
本番ユースケースで `limit` のデフォルトを 12 に上書きして使用する。

**検討した代替案**:
- コントラクトの default を 12 に変更 → サンプルコード（20件/ページ）が壊れるため却下

---

## 調査 4: シードデータ設計

### 判断: EXTENSION_PRODUCTS に25件以上の商品データを追加

**根拠**: ユーザー要望「ページングの確認ができるように十分な数のテストデータを用意する」。
12件/ページで3ページ以上を確認するため、最低25件の published 商品が必要。
BASE_PRODUCTS は5件が published（サンプル互換で不変）。
EXTENSION_PRODUCTS に20件以上を追加し、合計25件以上の published 商品を確保する。

**画像**: Unsplash の URL を使用（ユーザー指定）。
plan 時点では検証予定とし、実装時に HTTP リクエストで存在確認する。

**在庫バリエーション**:
- 在庫あり商品（大半）
- 在庫切れ商品（stock: 0）を2〜3件含める
- 画像未設定商品を1件含める（プレースホルダー表示テスト用）

---

## 調査 5: 既存 UI コンポーネントの再利用分析

### 判断: サンプル UI コンポーネントのパターンを踏襲しつつ、在庫表示を追加

**根拠**: 既存の `src/samples/domains/catalog/ui/` に `ProductCard`・`ProductList`・
`ProductDetail` が実装済み。本番用は `src/domains/catalog/ui/` に新規作成する。

**差分**:
| 機能 | サンプル | 本番（追加） |
|------|---------|-------------|
| 在庫状況表示 | なし | カードに「在庫切れ」ラベル |
| 在庫数表示 | なし | 詳細画面に在庫数 |
| カート追加ボタン無効化 | なし | stock === 0 で disabled |
| 検索フォーム | なし | 一覧ページに検索バー |
| ページサイズ | 20件 | 12件 |

**共通コンポーネント利用（原則 IV）**:
- `Loading`, `Error`, `Empty` → `@/templates/ui/components/status/` を使用
- `Layout` → `@/templates/ui/components/layout/Layout` を使用（既に buyer layout で使用済み）

---

## 調査 6: API ルートの既存構造

### 判断: 既存 API Routes をそのまま活用

**根拠**: `src/app/api/catalog/products/route.ts` と `[id]/route.ts` は既に配置済みで、
`@/domains/catalog/api` のスタブを呼び出している。スタブを本番実装に置換すれば
API は自動的に動作する。API Routes の変更は不要。

ただし `route.ts` の GET ハンドラで `searchParams` から `keyword` を取得する処理を
追加する必要がある。
