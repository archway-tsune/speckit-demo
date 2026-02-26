import { describe, it, expect } from 'vitest';
import { formatPrice, formatDateTime, formatDate, deserializeDates } from '@/components/utils/format';

// ─────────────────────────────────────────────────────────────────
// formatPrice
// ─────────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  describe('正常系', () => {
    it('Given 正の整数, When formatPrice(1000), Then "¥1,000" を返す', () => {
      expect(formatPrice(1000)).toBe('¥1,000');
    });

    it('Given 大きな数, When formatPrice(1000000), Then "¥1,000,000" を返す', () => {
      expect(formatPrice(1000000)).toBe('¥1,000,000');
    });

    it('Given 小さい正の数, When formatPrice(100), Then "¥100" を返す', () => {
      expect(formatPrice(100)).toBe('¥100');
    });

    it('Given 15800, When formatPrice(15800), Then "¥15,800" を返す', () => {
      expect(formatPrice(15800)).toBe('¥15,800');
    });
  });

  describe('0円の場合', () => {
    it('Given 0, When formatPrice(0), Then "無料" を返す', () => {
      expect(formatPrice(0)).toBe('無料');
    });
  });

  describe('負の数の場合', () => {
    it('Given 負の数, When formatPrice(-500), Then "-¥500" を返す', () => {
      expect(formatPrice(-500)).toBe('-¥500');
    });

    it('Given 大きな負の数, When formatPrice(-1500), Then "-¥1,500" を返す', () => {
      expect(formatPrice(-1500)).toBe('-¥1,500');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// formatDateTime
// ─────────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  describe('正常系（ISO文字列）', () => {
    it('Given 有効なISO文字列, When formatDateTime, Then 日本語フォーマットを返す', () => {
      const result = formatDateTime('2026-02-07T14:30:00');
      expect(result).toContain('2026');
      expect(result).toContain('2');
      expect(result).toContain('7');
      expect(result).toContain('14');
      expect(result).toContain('30');
    });
  });

  describe('正常系（Dateオブジェクト）', () => {
    it('Given Dateオブジェクト, When formatDateTime, Then 日本語フォーマットを返す', () => {
      const date = new Date(2026, 0, 1, 10, 0);
      const result = formatDateTime(date);
      expect(result).toContain('2026');
      expect(result).toContain('1');
      expect(result).toContain('1');
    });
  });

  describe('異常系', () => {
    it('Given 無効な日時文字列, When formatDateTime, Then "-" を返す', () => {
      expect(formatDateTime('invalid-date')).toBe('-');
    });

    it('Given 空文字列, When formatDateTime, Then "-" を返す', () => {
      expect(formatDateTime('')).toBe('-');
    });

    it('Given null, When formatDateTime, Then "-" を返す', () => {
      expect(formatDateTime(null as unknown as string)).toBe('-');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// formatDate
// ─────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('Given 有効なISO文字列, When formatDate, Then 日付のみ（時分なし）を返す', () => {
    const result = formatDate('2026-02-07T14:30:00');
    expect(result).toContain('2026');
    expect(result).toContain('2');
    expect(result).toContain('7');
    // 時分が含まれないことを確認
    expect(result).not.toContain('14');
    expect(result).not.toContain('30');
  });

  it('Given Dateオブジェクト, When formatDate, Then 日付のみを返す', () => {
    const date = new Date(2026, 0, 15, 10, 30);
    const result = formatDate(date);
    expect(result).toContain('2026');
    expect(result).toContain('1');
    expect(result).toContain('15');
  });

  it('Given 無効な日時文字列, When formatDate, Then "-" を返す', () => {
    expect(formatDate('invalid')).toBe('-');
  });
});

// ─────────────────────────────────────────────────────────────────
// deserializeDates
// ─────────────────────────────────────────────────────────────────

describe('deserializeDates', () => {
  it('Given createdAt/updatedAt が文字列, When deserializeDates, Then Date オブジェクトに変換', () => {
    const input = {
      id: '1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T12:00:00Z',
    };

    const result = deserializeDates(input);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.id).toBe('1');
  });

  it('Given createdAt/updatedAt が既に Date, When deserializeDates, Then そのまま返す', () => {
    const now = new Date();
    const input = { createdAt: now, updatedAt: now };
    const result = deserializeDates(input);
    expect(result.createdAt).toBe(now);
    expect(result.updatedAt).toBe(now);
  });

  it('Given createdAt/updatedAt が存在しない, When deserializeDates, Then 他のフィールドはそのまま', () => {
    const input = { id: '1', name: 'test' };
    const result = deserializeDates(input);
    expect(result).toEqual({ id: '1', name: 'test' });
  });
});
