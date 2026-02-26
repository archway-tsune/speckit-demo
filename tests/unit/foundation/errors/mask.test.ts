import { describe, it, expect } from 'vitest';
import { maskSensitiveInfo, formatErrorForLog } from '@/foundation/errors/mask';

describe('maskSensitiveInfo', () => {
  it('password パターンをマスクする', () => {
    expect(maskSensitiveInfo('password=secret123')).toBe('[REDACTED]');
  });

  it('token パターンをマスクする', () => {
    expect(maskSensitiveInfo('token: abc123')).toBe('[REDACTED]');
  });

  it('Bearer トークンをマスクする', () => {
    expect(maskSensitiveInfo('Bearer eyJhbGciOiJI')).toBe('[REDACTED]');
  });

  it('api_key パターンをマスクする', () => {
    expect(maskSensitiveInfo('api_key=xyz')).toBe('[REDACTED]');
  });

  it('機密情報がなければそのまま返す', () => {
    expect(maskSensitiveInfo('normal message')).toBe('normal message');
  });
});

describe('formatErrorForLog', () => {
  it('Error オブジェクトをフォーマットする', () => {
    const error = new Error('test error');
    const result = formatErrorForLog(error);
    expect(result).toContain('Error: test error');
  });

  it('Error のメッセージ内の機密情報をマスクする', () => {
    const error = new Error('failed with password=secret');
    const result = formatErrorForLog(error);
    expect(result).not.toContain('secret');
    expect(result).toContain('[REDACTED]');
  });

  it('非 Error 値を文字列化する', () => {
    expect(formatErrorForLog('string error')).toBe('string error');
    expect(formatErrorForLog(42)).toBe('42');
  });
});
