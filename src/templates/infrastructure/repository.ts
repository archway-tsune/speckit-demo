/**
 * インメモリリポジトリテンプレート
 *
 * HMR（Hot Module Replacement）対応のストアファクトリを提供。
 * 内部で `@/infrastructure/store` の `createStore()` を利用します。
 */
import { createStore } from '@/infrastructure/store';

/**
 * HMR（Hot Module Replacement）に対応したストアを生成（Layer 2）
 *
 * 型制約は `{ id: string }` のみ。
 *
 * @param name ストア名（一意である必要があります）
 * @param initializer 初期化コールバック（初回のみ呼ばれる）
 * @returns HMR対応のストア
 *
 * @example
 * ```typescript
 * const productStore = createHmrSafeStore<Product>('__sample_productStore', () =>
 *   new Map(sampleProducts.map(p => [p.id, p]))
 * );
 * ```
 */
export function createHmrSafeStore<T extends { id: string }>(
  name: string,
  initializer: () => Map<string, T>
): Map<string, T> {
  return createStore<T>(name, initializer);
}

/**
 * HMR対応のユーザーIDベースストアを生成（Layer 2）
 *
 * @param name ストア名
 * @returns HMR対応のユーザーIDベースストア
 */
export function createHmrSafeUserStore<T>(name: string): Map<string, T> {
  return createStore<T>(name, () => new Map<string, T>());
}
