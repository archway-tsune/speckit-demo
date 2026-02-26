/**
 * ID 生成ユーティリティ
 * 全リポジトリ共通の UUID 生成
 */
export function generateId(): string {
  return crypto.randomUUID();
}
