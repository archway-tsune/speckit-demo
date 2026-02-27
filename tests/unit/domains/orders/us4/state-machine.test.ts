/** Orders US4 - OrderStateMachine 単体テスト (ステータス遷移検証) */
import { describe, it, expect } from 'vitest';
import { OrderStateMachine, InvalidStatusTransitionError } from '@/domains/orders/api/state-machine';
import { ValidStatusTransitions } from '@/contracts/orders';
import type { OrderStatus } from '@/contracts/orders';

describe('OrderStateMachine', () => {
  describe('canTransition', () => {
    it('pending → confirmed は許可される', () => {
      expect(OrderStateMachine.canTransition('pending', 'confirmed')).toBe(true);
    });

    it('pending → cancelled は許可される', () => {
      expect(OrderStateMachine.canTransition('pending', 'cancelled')).toBe(true);
    });

    it('confirmed → shipped は許可される', () => {
      expect(OrderStateMachine.canTransition('confirmed', 'shipped')).toBe(true);
    });

    it('confirmed → cancelled は許可される', () => {
      expect(OrderStateMachine.canTransition('confirmed', 'cancelled')).toBe(true);
    });

    it('shipped → delivered は許可される', () => {
      expect(OrderStateMachine.canTransition('shipped', 'delivered')).toBe(true);
    });

    it('delivered → 任意への遷移は不可', () => {
      const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'cancelled'];
      for (const s of statuses) {
        expect(OrderStateMachine.canTransition('delivered', s)).toBe(false);
      }
    });

    it('cancelled → 任意への遷移は不可', () => {
      const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
      for (const s of statuses) {
        expect(OrderStateMachine.canTransition('cancelled', s)).toBe(false);
      }
    });

    it('pending → shipped は不可（pending は confirmed 経由が必須）', () => {
      expect(OrderStateMachine.canTransition('pending', 'shipped')).toBe(false);
    });

    it('pending → delivered は不可', () => {
      expect(OrderStateMachine.canTransition('pending', 'delivered')).toBe(false);
    });
  });

  describe('transition', () => {
    it('有効な遷移はエラーなく完了する', () => {
      expect(() => OrderStateMachine.transition('pending', 'confirmed')).not.toThrow();
    });

    it('無効な遷移は InvalidStatusTransitionError をスローする', () => {
      expect(() => OrderStateMachine.transition('delivered', 'pending')).toThrow(InvalidStatusTransitionError);
    });
  });

  describe('getAllowedTransitions', () => {
    it('ValidStatusTransitions と一致する', () => {
      const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      for (const status of statuses) {
        expect(OrderStateMachine.getAllowedTransitions(status)).toEqual(ValidStatusTransitions[status]);
      }
    });
  });
});
