/**
 * 監査フック 単体テスト
 * 既存実装へのテスト追加（ソースコード変更なし）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AuditAction,
  registerAuditHook,
  recordAudit,
  clearAuditHooks,
  type AuditLogEntry,
} from '@/foundation/logging/audit';

// モック: logger
vi.mock('@/foundation/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from '@/foundation/logging/logger';

describe('監査フック', () => {
  beforeEach(() => {
    clearAuditHooks();
    vi.clearAllMocks();
  });

  describe('AuditAction - 監査アクション種別', () => {
    it('Given AuditAction定数, When 値を参照, Then 全アクション種別が定義されている', () => {
      expect(AuditAction.CREATE).toBe('create');
      expect(AuditAction.UPDATE).toBe('update');
      expect(AuditAction.DELETE).toBe('delete');
      expect(AuditAction.STATUS_CHANGE).toBe('status_change');
    });
  });

  describe('registerAuditHook - フック登録', () => {
    it('Given フック関数, When registerAuditHook, Then unregister関数が返される', () => {
      // Arrange
      const hook = vi.fn();

      // Act
      const unregister = registerAuditHook(hook);

      // Assert
      expect(typeof unregister).toBe('function');
    });

    it('Given 登録済みフック, When recordAudit実行, Then フックが呼ばれる', async () => {
      // Arrange
      const hook = vi.fn();
      registerAuditHook(hook);

      // Act
      await recordAudit({
        action: AuditAction.CREATE,
        actorId: 'user-1',
        targetType: 'product',
        targetId: 'prod-1',
      });

      // Assert
      expect(hook).toHaveBeenCalledTimes(1);
      expect(hook).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          actorId: 'user-1',
          targetType: 'product',
          targetId: 'prod-1',
        })
      );
    });

    it('Given 登録済みフック, When unregister実行後にrecordAudit, Then フックは呼ばれない', async () => {
      // Arrange
      const hook = vi.fn();
      const unregister = registerAuditHook(hook);

      // Act
      unregister();
      await recordAudit({
        action: AuditAction.UPDATE,
        actorId: 'user-1',
        targetType: 'product',
        targetId: 'prod-1',
      });

      // Assert
      expect(hook).not.toHaveBeenCalled();
    });

    it('Given 既にunregister済みのフック, When 二重unregister, Then エラーなく安全に処理される', async () => {
      // Arrange
      const hook = vi.fn();
      const unregister = registerAuditHook(hook);

      // Act & Assert — 二重 unregister でエラーが発生しないこと
      unregister();
      expect(() => unregister()).not.toThrow();
    });
  });

  describe('recordAudit - 監査ログ記録', () => {
    it('Given 監査エントリ, When recordAudit, Then タイムスタンプが自動設定される', async () => {
      // Arrange
      const hook = vi.fn();
      registerAuditHook(hook);
      const before = new Date();

      // Act
      await recordAudit({
        action: AuditAction.CREATE,
        actorId: 'user-1',
        targetType: 'order',
        targetId: 'ord-1',
      });

      const after = new Date();

      // Assert
      const entry = hook.mock.calls[0][0] as AuditLogEntry;
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('Given 監査エントリ, When recordAudit, Then logger.infoが呼ばれる', async () => {
      // Act
      await recordAudit({
        action: AuditAction.DELETE,
        actorId: 'admin-1',
        targetType: 'product',
        targetId: 'prod-99',
        details: { reason: 'expired' },
      });

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Audit log', {
        action: 'delete',
        actorId: 'admin-1',
        targetType: 'product',
        targetId: 'prod-99',
        details: { reason: 'expired' },
      });
    });

    it('Given 複数フック登録, When recordAudit, Then 全フックが実行される', async () => {
      // Arrange
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const hook3 = vi.fn();
      registerAuditHook(hook1);
      registerAuditHook(hook2);
      registerAuditHook(hook3);

      // Act
      await recordAudit({
        action: AuditAction.UPDATE,
        actorId: 'user-1',
        targetType: 'cart',
        targetId: 'cart-1',
      });

      // Assert
      expect(hook1).toHaveBeenCalledTimes(1);
      expect(hook2).toHaveBeenCalledTimes(1);
      expect(hook3).toHaveBeenCalledTimes(1);
    });

    it('Given asyncフック, When recordAudit, Then 非同期フックが正しく処理される', async () => {
      // Arrange
      const results: string[] = [];
      const asyncHook = async (entry: AuditLogEntry) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(`async-${entry.targetId}`);
      };
      const syncHook = (entry: AuditLogEntry) => {
        results.push(`sync-${entry.targetId}`);
      };
      registerAuditHook(asyncHook);
      registerAuditHook(syncHook);

      // Act
      await recordAudit({
        action: AuditAction.CREATE,
        actorId: 'user-1',
        targetType: 'product',
        targetId: 'p1',
      });

      // Assert
      expect(results).toContain('async-p1');
      expect(results).toContain('sync-p1');
    });
  });

  describe('エラーハンドリング', () => {
    it('Given フック失敗, When recordAudit, Then logger.errorが呼ばれ他フックは継続する', async () => {
      // Arrange
      const failingHook = vi.fn().mockRejectedValue(new Error('hook error'));
      const successHook = vi.fn();
      registerAuditHook(failingHook);
      registerAuditHook(successHook);

      // Act
      await recordAudit({
        action: AuditAction.STATUS_CHANGE,
        actorId: 'user-1',
        targetType: 'order',
        targetId: 'ord-1',
      });

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Audit hook failed',
        expect.any(Error)
      );
      expect(successHook).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAuditHooks - 全フック除去', () => {
    it('Given 登録済みフックあり, When clearAuditHooks, Then 全フックが除去される', async () => {
      // Arrange
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      registerAuditHook(hook1);
      registerAuditHook(hook2);

      // Act
      clearAuditHooks();
      await recordAudit({
        action: AuditAction.CREATE,
        actorId: 'user-1',
        targetType: 'product',
        targetId: 'prod-1',
      });

      // Assert
      expect(hook1).not.toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
    });
  });
});
