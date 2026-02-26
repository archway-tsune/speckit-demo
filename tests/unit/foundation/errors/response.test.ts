import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  success,
  error,
  createSuccessResponseSchema,
  ErrorResponseSchema,
} from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

describe('success', () => {
  it('成功レスポンスを生成する', () => {
    const result = success({ id: '1', name: 'test' });
    expect(result).toEqual({
      success: true,
      data: { id: '1', name: 'test' },
    });
  });
});

describe('error', () => {
  it('エラーレスポンスを生成する', () => {
    const result = error(ErrorCode.NOT_FOUND, 'Not found');
    expect(result).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
        fieldErrors: undefined,
      },
    });
  });

  it('fieldErrors 付きエラーレスポンスを生成する', () => {
    const result = error(ErrorCode.VALIDATION_ERROR, 'Invalid', [
      { field: 'name', message: '必須' },
    ]);
    expect(result.error.fieldErrors).toHaveLength(1);
    expect(result.error.fieldErrors![0].field).toBe('name');
  });
});

describe('createSuccessResponseSchema', () => {
  it('データスキーマをラップした成功レスポンススキーマを返す', () => {
    const schema = createSuccessResponseSchema(z.object({ id: z.string() }));
    const parsed = schema.parse({ success: true, data: { id: '1' } });
    expect(parsed.data.id).toBe('1');
  });
});

describe('ErrorResponseSchema', () => {
  it('有効なエラーレスポンスをパースする', () => {
    const parsed = ErrorResponseSchema.parse({
      success: false,
      error: { code: 'NOT_FOUND', message: 'not found' },
    });
    expect(parsed.error.code).toBe('NOT_FOUND');
  });
});
