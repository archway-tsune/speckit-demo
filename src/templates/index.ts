/**
 * アーキテクチャテンプレート メインエクスポート
 *
 * このパッケージは、ECサイトアーキテクチャのテンプレートを提供します。
 * UIコンポーネントは @/components/ に移動しました。
 *
 * 含まれるテンプレート:
 *
 * 1. API テンプレート
 *    - 認証API（ログイン、ログアウト、セッション）
 *
 * 2. インフラストラクチャ テンプレート
 *    - HMR対応ストアファクトリ
 *    - セッション管理
 *    - テストリセット
 */

// ─────────────────────────────────────────────────────────────────
// API テンプレート
// ─────────────────────────────────────────────────────────────────

// 認証API
export {
  createLoginHandler,
  createLogoutHandler,
  createSessionHandler,
} from './api/auth';

// ルートハンドラー HOF
export { createRouteHandler } from './api/route-handler';
export type { CreateRouteHandlerOptions, RouteHandlerContext, RouteSession } from './api/route-handler';
// ─────────────────────────────────────────────────────────────────
// インフラストラクチャ テンプレート
// ─────────────────────────────────────────────────────────────────

export {
  createHmrSafeStore,
  createHmrSafeUserStore,
  createSessionManager,
  createResetHandler,
} from './infrastructure';
export type {
  UserTypeConfig,
} from './infrastructure';
