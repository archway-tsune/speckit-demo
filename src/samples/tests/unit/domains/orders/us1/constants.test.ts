/**
 * 注文ステータス共有定義 単体テスト
 *
 * AC1: 全注文ステータス値（pending, confirmed, shipped, delivered, cancelled）に
 *       ラベルとカラーが定義されていること
 */
import { describe, it, expect } from 'vitest';
import { orderStatusLabels, orderStatusColors } from '@/components/data-display/order-status';

const allStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

describe('orderStatusLabels', () => {
  it.each(allStatuses)('should have a label for status "%s"', (status) => {
    expect(orderStatusLabels[status]).toBeDefined();
    expect(typeof orderStatusLabels[status]).toBe('string');
    expect(orderStatusLabels[status].length).toBeGreaterThan(0);
  });
});

describe('orderStatusColors', () => {
  it.each(allStatuses)('should have a color class for status "%s"', (status) => {
    expect(orderStatusColors[status]).toBeDefined();
    expect(typeof orderStatusColors[status]).toBe('string');
    expect(orderStatusColors[status].length).toBeGreaterThan(0);
  });
});
