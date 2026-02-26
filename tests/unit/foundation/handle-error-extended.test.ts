/**
 * handleError() 拡張テスト
 * ForbiddenError, ValidationError が AppError を継承していないため、
 * handleError() がこれらを正しくマッピングすることを検証
 */
import { describe, it, expect } from 'vitest';
import { handleError, ErrorCode } from '@/foundation/errors/handler';
import { ForbiddenError } from '@/foundation/auth/authorize';
import { ValidationError } from '@/foundation/validation/runtime';
import { NotFoundError } from '@/foundation/errors/domain-errors';

describe('handleError() 拡張', () => {
  describe('ForbiddenError → 403', () => {
    it('Given ForbiddenError, When handleError(), Then FORBIDDEN + 403', () => {
      const err = new ForbiddenError();
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.FORBIDDEN);
      expect(result.httpStatus).toBe(403);
      expect(result.message).toBe('この操作を行う権限がありません');
    });

    it('Given ForbiddenError カスタムメッセージ, When handleError(), Then メッセージ保持', () => {
      const err = new ForbiddenError('セッションが無効です');
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.FORBIDDEN);
      expect(result.httpStatus).toBe(403);
      expect(result.message).toBe('セッションが無効です');
    });
  });

  describe('ValidationError → 400', () => {
    it('Given ValidationError with fieldErrors, When handleError(), Then VALIDATION_ERROR + 400 + fieldErrors', () => {
      const fieldErrors = [
        { field: 'name', message: '必須項目です' },
        { field: 'price', message: '0 以上である必要があります' },
      ];
      const err = new ValidationError(fieldErrors);
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe('入力内容に誤りがあります');
      expect(result.fieldErrors).toEqual(fieldErrors);
    });

    it('Given ValidationError カスタムメッセージ, When handleError(), Then メッセージ保持', () => {
      const fieldErrors = [{ field: 'email', message: '無効な形式です' }];
      const err = new ValidationError(fieldErrors, 'バリデーション失敗');
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.httpStatus).toBe(400);
      expect(result.message).toBe('バリデーション失敗');
      expect(result.fieldErrors).toEqual(fieldErrors);
    });
  });

  describe('AppError 継承クラス (NotFoundError) → 404', () => {
    it('Given NotFoundError, When handleError(), Then NOT_FOUND + 404', () => {
      const err = new NotFoundError();
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.httpStatus).toBe(404);
    });
  });

  describe('未知エラー → 500', () => {
    it('Given 通常の Error, When handleError(), Then INTERNAL_ERROR + 500', () => {
      const err = new Error('unknown');
      const result = handleError(err);
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.httpStatus).toBe(500);
    });

    it('Given 非 Error オブジェクト, When handleError(), Then INTERNAL_ERROR + 500', () => {
      const result = handleError('string error');
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.httpStatus).toBe(500);
    });
  });
});
