/**
 * LoginPage コンポーネント 単体テスト
 * TDD: RED Phase — onSuccess コールバック対応
 *
 * 現在の LoginPage は redirectUrl に直接 router.push する。
 * onSuccess コールバックを受け取り、ログイン成功時に呼び出す仕様への変更をテスト。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

import { LoginPage } from '@/components/pages/login';

describe('LoginPage - onSuccess コールバック対応', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('Given onSuccess, When ログイン成功, Then onSuccess が認証データで呼ばれる', async () => {
    // Arrange
    const onSuccess = vi.fn();
    const authData = { userId: 'u1', role: 'buyer', name: 'テスト' };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: authData }),
    });

    render(<LoginPage onSuccess={onSuccess} />);

    // Act
    await user.type(screen.getByLabelText('メールアドレス'), 'buyer@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'demo');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Assert
    expect(onSuccess).toHaveBeenCalledWith(authData);
  });

  it('Given onSuccess, When ログイン成功, Then router.push は呼ばれない（onSuccess に委譲）', async () => {
    // Arrange
    const onSuccess = vi.fn();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { userId: 'u1', role: 'buyer', name: 'テスト' } }),
    });

    render(<LoginPage onSuccess={onSuccess} />);

    // Act
    await user.type(screen.getByLabelText('メールアドレス'), 'buyer@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'demo');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Assert — onSuccess 指定時はコンポーネント内でリダイレクトしない
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('Given onSuccess なし, When ログイン成功, Then redirectUrl に router.push する（従来動作）', async () => {
    // Arrange
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { userId: 'u1', role: 'buyer', name: 'テスト' } }),
    });

    render(<LoginPage redirectUrl="/catalog" />);

    // Act
    await user.type(screen.getByLabelText('メールアドレス'), 'buyer@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'demo');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Assert — 従来通り redirectUrl にリダイレクト
    expect(mockPush).toHaveBeenCalledWith('/catalog');
  });

  it('Given onSuccess + roleCheck 失敗, When ログイン成功, Then onSuccess は呼ばれない', async () => {
    // Arrange
    const onSuccess = vi.fn();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { userId: 'u1', role: 'buyer', name: 'テスト' } }),
      })
      .mockResolvedValueOnce({ ok: true }); // logout call

    render(
      <LoginPage
        onSuccess={onSuccess}
        roleCheck={(role) => role === 'admin'}
        roleErrorMessage="管理者権限が必要です"
      />
    );

    // Act
    await user.type(screen.getByLabelText('メールアドレス'), 'buyer@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'demo');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Assert
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('管理者権限が必要です')).toBeInTheDocument();
  });
});
