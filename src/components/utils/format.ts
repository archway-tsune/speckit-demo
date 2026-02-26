/**
 * フォーマットユーティリティ
 *
 * 使用例:
 * - 価格表示のフォーマット（商品一覧、カート、注文詳細）
 * - 日時表示のフォーマット（注文日時、更新日時）
 *
 * カスタマイズポイント:
 * - 通貨記号
 * - 日時フォーマットのロケール
 */

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

// （本ファイルはプリミティブ型のみ使用するため、型定義セクションは省略）

// ─────────────────────────────────────────────────────────────────
// 価格フォーマット
// ─────────────────────────────────────────────────────────────────

/**
 * 価格をフォーマットする
 *
 * @param price - フォーマットする価格（数値）
 * @returns フォーマット済み文字列
 *
 * @example
 * ```typescript
 * formatPrice(1000);   // → '¥1,000'
 * formatPrice(0);      // → '無料'
 * formatPrice(-500);   // → '-¥500'
 * ```
 */
export function formatPrice(price: number): string {
  if (price === 0) return '無料';

  const isNegative = price < 0;
  const absFormatted = `¥${Math.abs(price).toLocaleString('ja-JP')}`;

  return isNegative ? `-${absFormatted}` : absFormatted;
}

// ─────────────────────────────────────────────────────────────────
// 日時フォーマット
// ─────────────────────────────────────────────────────────────────

/**
 * 日時を日本語ロケールでフォーマットする
 *
 * @param date - フォーマットする日時（Date オブジェクトまたは ISO 文字列）
 * @returns ja-JP ロケールのフォーマット済み文字列
 *
 * @example
 * ```typescript
 * formatDateTime('2026-02-07T14:30:00');  // → '2026年2月7日 14:30'
 * formatDateTime(new Date());              // → '2026年2月7日 10:00'
 * formatDateTime('invalid');               // → '-'
 * ```
 */
/**
 * 日付のみをフォーマットする（時分なし）
 *
 * @example
 * ```typescript
 * formatDate('2026-02-07T14:30:00');  // → '2026年2月7日'
 * ```
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '-';

    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return '-';
  }
}

/**
 * オブジェクトの createdAt / updatedAt フィールドを Date に変換する
 *
 * @example
 * ```typescript
 * const order = deserializeDates({ id: '1', createdAt: '2026-02-07T14:30:00' });
 * order.createdAt instanceof Date; // true
 * ```
 */
export function deserializeDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of ['createdAt', 'updatedAt'] as const) {
    if (typeof result[key] === 'string') {
      result[key] = new Date(result[key] as string);
    }
  }
  return result as T;
}

export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '-';

    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '-';
  }
}
