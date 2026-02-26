/**
 * BuyerLayout コンポーネント 単体テスト
 * TDD: RED Phase — autoLogin 削除検証
 *
 * autoLogin は BuyerLayout のデモ用機能で、本来テンプレートには不要。
 * autoLogin を完全に削除し、シンプルなセッション管理のみのレイアウトにする。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}));

import { BuyerLayout } from '@/components/layouts/BuyerLayout';

describe('BuyerLayout - autoLogin 削除検証', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('Given autoLogin 有効設定, When 未認証状態で初期化, Then login エンドポイントに POST しない', async () => {
    // Arrange — セッション取得失敗（未認証）
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
    });

    // Act — autoLogin を有効にして渡しても自動ログインしないことを検証
    // Green フェーズで autoLogin props を削除すると、この props は型エラーになるが
    // 動作としては POST が呼ばれないことで PASS する
    render(
      // @ts-expect-error autoLogin が削除されたら型エラーになる（Green で期待通り）
      <BuyerLayout autoLogin={{ enabled: true, email: 'test@example.com', password: 'demo' }}>
        <div>テストコンテンツ</div>
      </BuyerLayout>
    );

    // Assert — 初期化完了を待つ
    await waitFor(() => {
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });

    // fetch は session エンドポイントの GET のみ。POST（autoLogin）は一切なし
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const postCalls = fetchCalls.filter(
      (call: unknown[]) => (call[1] as { method?: string } | undefined)?.method === 'POST'
    );
    expect(postCalls).toHaveLength(0);
  });

  it('Given セッションあり, When 初期化, Then カート件数を取得してヘッダーに表示する', async () => {
    // Arrange
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { userId: 'u1', role: 'buyer', name: 'テスト' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { itemCount: 3 } }),
      });

    // Act
    render(
      <BuyerLayout>
        <div>コンテンツ</div>
      </BuyerLayout>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    });
  });
});
