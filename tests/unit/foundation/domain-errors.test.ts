/**
 * 共通ドメインエラークラス 単体テスト
 * TDD: RED — AppError 継承、ErrorCode 固定値、handleError() 統合を検証
 */
import { describe, it, expect } from 'vitest';
import { handleError, AppError, ErrorCode } from '@/foundation/errors/handler';
import { NotFoundError, NotImplementedError } from '@/foundation/errors/domain-errors';

describe('共通ドメインエラークラス', () => {
  describe('NotFoundError', () => {
    it('Given NotFoundError, When 生成, Then AppError を継承している', () => {
      const error = new NotFoundError();
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('Given NotFoundError, When 生成, Then ErrorCode.NOT_FOUND が設定される', () => {
      const error = new NotFoundError();
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('Given NotFoundError, When デフォルトメッセージ, Then 適切なメッセージが設定される', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('リソースが見つかりません');
    });

    it('Given NotFoundError, When カスタムメッセージ, Then カスタムメッセージが使用される', () => {
      const error = new NotFoundError('商品が見つかりません');
      expect(error.message).toBe('商品が見つかりません');
    });

    it('Given NotFoundError, When handleError() に渡す, Then 404 ステータスが返る', () => {
      const error = new NotFoundError();
      const result = handleError(error);
      expect(result.httpStatus).toBe(404);
      expect(result.code).toBe(ErrorCode.NOT_FOUND);
    });
  });

  describe('NotImplementedError', () => {
    it('Given NotImplementedError, When 生成, Then AppError を継承している', () => {
      const error = new NotImplementedError('catalog', 'listProducts');
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });

    it('Given NotImplementedError, When 生成, Then ErrorCode.NOT_IMPLEMENTED が設定される', () => {
      const error = new NotImplementedError('catalog', 'listProducts');
      expect(error.code).toBe(ErrorCode.NOT_IMPLEMENTED);
    });

    it('Given NotImplementedError, When ドメインと操作名を指定, Then メッセージにドメインと操作名が含まれる', () => {
      const error = new NotImplementedError('catalog', 'listProducts');
      expect(error.message).toContain('catalog');
      expect(error.message).toContain('listProducts');
    });

    it('Given NotImplementedError, When handleError() に渡す, Then 501 ステータスが返る', () => {
      const error = new NotImplementedError('cart', 'addItem');
      const result = handleError(error);
      expect(result.httpStatus).toBe(501);
      expect(result.code).toBe(ErrorCode.NOT_IMPLEMENTED);
    });
  });
});
