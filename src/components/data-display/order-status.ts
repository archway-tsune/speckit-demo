/**
 * 注文ステータス共有定義
 *
 * StatusBadge と組み合わせて使用する。
 * サンプル・本番の両方から import 可能。
 */

/** 注文ステータス → 日本語ラベル */
export const orderStatusLabels: Record<string, string> = {
  pending: '処理待ち',
  confirmed: '確定済み',
  shipped: '発送済み',
  delivered: '配達完了',
  cancelled: 'キャンセル',
};

/** 注文ステータス → Tailwind カラークラス */
export const orderStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
