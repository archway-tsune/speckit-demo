/**
 * Catalog ドメイン - API エクスポート
 * 本番ユースケース実装を公開する。
 */

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  NotFoundError,
} from './usecases';
export type { CatalogContext } from './usecases';

/**
 * ドメイン未実装エラー（後方互換性のため残存）
 * 本番実装完了後は使用されないが、既存の Route ハンドラの catch 句で参照されるため維持。
 */
export class NotImplementedError extends Error {
  constructor(domain: string, operation: string) {
    super(`ドメイン未実装: ${domain}.${operation}`);
    this.name = 'NotImplementedError';
  }
}
