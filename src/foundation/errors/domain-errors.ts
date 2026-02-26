/**
 * 共通ドメインエラークラス
 * ECサイト向けアーキテクチャ基盤 - ドメイン横断エラー定義
 *
 * AppError を継承し、固定の ErrorCode を持つ。
 * handleError() が instanceof AppError で自動処理する。
 */
import { AppError, ErrorCode } from './handler';

/**
 * リソース未存在エラー
 */
export class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません') {
    super(ErrorCode.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

/**
 * ドメイン未実装エラー
 */
export class NotImplementedError extends AppError {
  constructor(domain: string, operation: string) {
    super(
      ErrorCode.NOT_IMPLEMENTED,
      `${domain}.${operation} は未実装です`
    );
    this.name = 'NotImplementedError';
  }
}
