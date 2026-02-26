/**
 * HMR 対応ストア初期化ユーティリティ
 * Next.js 開発モードの Hot Module Replacement でモジュールが再読み込みされても
 * データを保持するための globalThis ベースのストアヘルパー
 */

/**
 * HMR 対応のグローバルストアを作成/取得する
 * @param name グローバル変数名（一意であること）
 * @param initializer 初期化関数（初回のみ呼ばれる）
 * @returns Map<string, T> ストアインスタンス
 */
export function createStore<T>(
  name: string,
  initializer?: () => Map<string, T>
): Map<string, T> {
  const key = `__store_${name}` as keyof typeof globalThis;

  if ((globalThis as Record<string, unknown>)[key]) {
    return (globalThis as Record<string, unknown>)[key] as Map<string, T>;
  }

  const store = initializer ? initializer() : new Map<string, T>();
  (globalThis as Record<string, unknown>)[key] = store;
  return store;
}
