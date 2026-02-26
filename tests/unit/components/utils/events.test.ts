/**
 * emitCartUpdated 単体テスト
 *
 * AC4: emitCartUpdated() 呼び出しで window.dispatchEvent に
 *      CustomEvent('cart-updated') が渡されること
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitCartUpdated } from '@/components/utils/events';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('emitCartUpdated', () => {
  it('should dispatch a CustomEvent with type "cart-updated"', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');

    emitCartUpdated();

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0];
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.type).toBe('cart-updated');
  });
});
