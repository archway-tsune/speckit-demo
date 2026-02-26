/**
 * API ルートハンドラーファクトリ
 *
 * セッション確認 + エラーハンドリングを統一する高階関数。
 * - 認証チェック（getSession → 未認証なら 401）
 * - handleError() による AppError / ForbiddenError / ValidationError マッピング
 * - error.name 慣例による domain エラーマッピング（"NotFound"→404, "Forbidden"→403）
 * - 未知エラー → 500 + console.error
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { error } from '@/foundation/errors/response';

/**
 * セッション型（最小要件）
 */
export interface RouteSession {
  userId: string;
  role: string;
  expiresAt: Date;
}

/**
 * ハンドラーコンテキスト
 */
export interface RouteHandlerContext<S extends RouteSession = RouteSession> {
  session: S;
  params: Record<string, string>;
}

/**
 * createRouteHandler オプション
 */
export interface CreateRouteHandlerOptions<S extends RouteSession = RouteSession> {
  /** セッション取得関数 */
  getSession: () => Promise<S | null>;
  /** 認証必要フラグ（デフォルト: true） */
  requireAuth?: boolean;
}

/** error.name → ErrorCode マッピング */
const nameToErrorCode: Record<string, ErrorCode> = {
  NotFound: ErrorCode.NOT_FOUND,
  Forbidden: ErrorCode.FORBIDDEN,
  Validation: ErrorCode.VALIDATION_ERROR,
};

/** ErrorCode → HTTP status マッピング */
const errorCodeToStatus: Record<string, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

/**
 * error.name 慣例ベースでエラーコードを推定
 */
function resolveErrorCodeByName(name: string): ErrorCode | null {
  for (const [keyword, code] of Object.entries(nameToErrorCode)) {
    if (name.includes(keyword)) return code;
  }
  return null;
}

type HandlerFunction<S extends RouteSession = RouteSession> = (
  request: NextRequest,
  context: RouteHandlerContext<S>,
) => Promise<NextResponse> | NextResponse;

/**
 * ルートハンドラーラッパーを生成する
 */
export function createRouteHandler<S extends RouteSession = RouteSession>(options: CreateRouteHandlerOptions<S>) {
  const { getSession, requireAuth = true } = options;

  return {
    handler: async (
      request: NextRequest,
      handlerFn: HandlerFunction<S>,
      routeParams?: { params: Promise<Record<string, string>> },
    ): Promise<NextResponse> => {
      try {
        // セッション取得
        const session = await getSession();

        // 認証チェック
        if (requireAuth && !session) {
          return NextResponse.json(
            error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
            { status: 401 },
          );
        }

        // route params の解決
        const params = routeParams ? await routeParams.params : {};

        // ハンドラー実行
        const context: RouteHandlerContext<S> = {
          session: session as S,
          params,
        };

        return await Promise.resolve(handlerFn(request, context));
      } catch (err) {
        // 1. handleError() で AppError / ForbiddenError / ValidationError を処理
        const result = handleError(err);
        if (result.code !== ErrorCode.INTERNAL_ERROR) {
          return NextResponse.json(
            error(result.code, result.message, result.fieldErrors),
            { status: result.httpStatus },
          );
        }

        // 2. error.name 慣例マッピング（ドメインエラー）
        if (err instanceof Error) {
          const code = resolveErrorCodeByName(err.name);
          if (code) {
            return NextResponse.json(
              error(code, err.message),
              { status: errorCodeToStatus[code] ?? 500 },
            );
          }
        }

        // 3. 未知エラー → 500
        console.error('Route handler error:', err);
        return NextResponse.json(
          error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
          { status: 500 },
        );
      }
    },
  };
}
