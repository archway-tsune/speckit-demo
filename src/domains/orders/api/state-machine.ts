/**
 * Orders ドメイン - OrderStateMachine
 * ValidStatusTransitions を唯一の情報源としてステータス遷移を厳密に管理する
 */
import type { OrderStatus } from '@/contracts/orders';
import { ValidStatusTransitions } from '@/contracts/orders';
import { AppError, ErrorCode } from '@/foundation/errors/handler';

/**
 * 不正なステータス遷移エラー
 */
export class InvalidStatusTransitionError extends AppError {
  constructor(current?: OrderStatus, next?: OrderStatus) {
    const message = current && next
      ? `ステータスを ${current} から ${next} に変更できません`
      : '不正なステータス遷移です';
    super(ErrorCode.VALIDATION_ERROR, message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class OrderStateMachine {
  static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    return ValidStatusTransitions[current].includes(next);
  }

  static transition(current: OrderStatus, next: OrderStatus): void {
    if (!OrderStateMachine.canTransition(current, next)) {
      throw new InvalidStatusTransitionError(current, next);
    }
  }

  static getAllowedTransitions(current: OrderStatus): readonly OrderStatus[] {
    return ValidStatusTransitions[current];
  }
}
