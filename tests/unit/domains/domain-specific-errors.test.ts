/**
 * ドメイン固有エラークラス 単体テスト
 * TDD: RED — EmptyCartError, CartItemNotFoundError, InvalidStatusTransitionError が
 * AppError を継承し正しい ErrorCode を持つことを検証
 */
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode, handleError } from '@/foundation/errors/handler';
import { EmptyCartError, InvalidStatusTransitionError } from '@/domains/orders/api';
import { CartItemNotFoundError } from '@/domains/cart/api';

describe('ドメイン固有エラークラス', () => {
  describe('EmptyCartError', () => {
    it('Given EmptyCartError, When 生成, Then AppError を継承している', () => {
      const error = new EmptyCartError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('Given EmptyCartError, When 生成, Then ErrorCode.VALIDATION_ERROR が設定される', () => {
      const error = new EmptyCartError();
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('Given EmptyCartError, When デフォルトメッセージ, Then 適切なメッセージが設定される', () => {
      const error = new EmptyCartError();
      expect(error.message).toBe('カートが空です');
    });

    it('Given EmptyCartError, When handleError() に渡す, Then 400 ステータスが返る', () => {
      const error = new EmptyCartError();
      const result = handleError(error);
      expect(result.httpStatus).toBe(400);
    });
  });

  describe('CartItemNotFoundError', () => {
    it('Given CartItemNotFoundError, When 生成, Then AppError を継承している', () => {
      const error = new CartItemNotFoundError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('Given CartItemNotFoundError, When 生成, Then ErrorCode.NOT_FOUND が設定される', () => {
      const error = new CartItemNotFoundError();
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('Given CartItemNotFoundError, When デフォルトメッセージ, Then 適切なメッセージが設定される', () => {
      const error = new CartItemNotFoundError();
      expect(error.message).toBe('カートアイテムが見つかりません');
    });

    it('Given CartItemNotFoundError, When handleError() に渡す, Then 404 ステータスが返る', () => {
      const error = new CartItemNotFoundError();
      const result = handleError(error);
      expect(result.httpStatus).toBe(404);
    });
  });

  describe('InvalidStatusTransitionError', () => {
    it('Given InvalidStatusTransitionError, When 生成, Then AppError を継承している', () => {
      const error = new InvalidStatusTransitionError();
      expect(error).toBeInstanceOf(AppError);
    });

    it('Given InvalidStatusTransitionError, When 生成, Then ErrorCode.VALIDATION_ERROR が設定される', () => {
      const error = new InvalidStatusTransitionError();
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('Given InvalidStatusTransitionError, When デフォルトメッセージ, Then 適切なメッセージが設定される', () => {
      const error = new InvalidStatusTransitionError();
      expect(error.message).toBe('不正なステータス遷移です');
    });

    it('Given InvalidStatusTransitionError, When handleError() に渡す, Then 400 ステータスが返る', () => {
      const error = new InvalidStatusTransitionError();
      const result = handleError(error);
      expect(result.httpStatus).toBe(400);
    });
  });
});
