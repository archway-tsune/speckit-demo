/**
 * callbackUrl バリデーション
 *
 * セキュリティ要件:
 * - 相対パスのみ許可（外部URL拒否）
 * - protocol-relative URL 拒否（//evil.com）
 * - ロール適切性検証（admin ログインで buyer ページ → 拒否）
 */

export interface ValidateCallbackUrlOptions {
  /** callbackUrl が無効な場合のフォールバック先 */
  defaultUrl: string;
  /** ログインユーザーのロール */
  role: 'buyer' | 'admin';
}

/**
 * callbackUrl を検証し、安全なリダイレクト先を返す
 *
 * @param url - クエリパラメータから取得した callbackUrl（null 可）
 * @param options - デフォルトURL とロール
 * @returns 安全なリダイレクト先URL
 */
export function validateCallbackUrl(
  url: string | null,
  options: ValidateCallbackUrlOptions
): string {
  const { defaultUrl, role } = options;

  // null・空文字 → デフォルト
  if (!url || url === '') {
    return defaultUrl;
  }

  // 先頭が / でない、または // で始まる（protocol-relative）→ デフォルト
  if (!url.startsWith('/') || url.startsWith('//')) {
    return defaultUrl;
  }

  // ロール適切性検証
  if (!isPathAllowedForRole(url, role)) {
    return defaultUrl;
  }

  return url;
}

/** パスの /sample/ プレフィックスを除去して正規化する */
function normalizePath(path: string): string {
  if (path.startsWith('/sample/')) {
    return '/' + path.slice('/sample/'.length);
  }
  return path;
}

/** 購入者専用パス */
const BUYER_ONLY_PREFIXES = ['/cart', '/orders', '/checkout'];

/** 管理者専用パス */
const ADMIN_PREFIX = '/admin';

/** パスがロールに対して許可されているか判定する */
function isPathAllowedForRole(url: string, role: 'buyer' | 'admin'): boolean {
  const normalized = normalizePath(url);

  if (role === 'admin') {
    // admin は buyer 専用パスにアクセスできない
    for (const prefix of BUYER_ONLY_PREFIXES) {
      if (normalized === prefix || normalized.startsWith(prefix + '/')) {
        return false;
      }
    }
    return true;
  }

  // buyer は admin パスにアクセスできない
  if (normalized === ADMIN_PREFIX || normalized.startsWith(ADMIN_PREFIX + '/')) {
    return false;
  }

  return true;
}
