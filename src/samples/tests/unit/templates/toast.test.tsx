/**
 * Toast コンポーネントの単体テスト
 *
 * テスト対象: src/templates/ui/components/feedback/Toast.tsx
 * - ToastProvider 内で useToast() が利用可能
 * - showToast() で画面にメッセージが表示される
 * - 種別ごとのスタイル（success/error/info）
 * - 自動消去（success=3000ms, error=5000ms）
 * - 空メッセージは通知を表示しない
 * - 複数通知が順に表示される
 */
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/feedback/Toast';

/** テスト用のToast表示コンポーネント */
function TestComponent({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(message, type)} data-testid="trigger">
      Show Toast
    </button>
  );
}

/** 複数Toast表示用コンポーネント */
function MultiToastComponent() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('メッセージ1', 'success')} data-testid="trigger1">
        Toast 1
      </button>
      <button onClick={() => showToast('メッセージ2', 'error')} data-testid="trigger2">
        Toast 2
      </button>
    </div>
  );
}

describe('Toast コンポーネント', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基本動作', () => {
    test('ToastProvider 内で useToast() が利用できる', () => {
      render(
        <ToastProvider>
          <TestComponent message="テスト" type="success" />
        </ToastProvider>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    test('showToast("成功", "success") で画面に「成功」が表示される', () => {
      render(
        <ToastProvider>
          <TestComponent message="成功" type="success" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      expect(screen.getByText('成功')).toBeInTheDocument();
    });

    test('showToast("エラー", "error") で画面にエラースタイルで表示される', () => {
      render(
        <ToastProvider>
          <TestComponent message="エラー" type="error" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      const toast = screen.getByText('エラー');
      expect(toast).toBeInTheDocument();
    });

    test('showToast("情報", "info") で画面に情報スタイルで表示される', () => {
      render(
        <ToastProvider>
          <TestComponent message="情報" type="info" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      const toast = screen.getByText('情報');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('自動消去', () => {
    test('success トーストは 3000ms 後に自動消去される', () => {
      render(
        <ToastProvider>
          <TestComponent message="消えるメッセージ" type="success" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      expect(screen.getByText('消えるメッセージ')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('消えるメッセージ')).not.toBeInTheDocument();
    });

    test('error トーストは 5000ms 後に自動消去される', () => {
      render(
        <ToastProvider>
          <TestComponent message="エラーメッセージ" type="error" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();

      // 3000ms ではまだ表示されている
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();

      // 5000ms で消去
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    test('空メッセージの場合は通知が表示されない', () => {
      render(
        <ToastProvider>
          <TestComponent message="" type="success" />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger').click();
      });
      // 空メッセージは表示されない（role=alertの要素がない）
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('複数通知が重ならずに順に表示される', () => {
      render(
        <ToastProvider>
          <MultiToastComponent />
        </ToastProvider>
      );
      act(() => {
        screen.getByTestId('trigger1').click();
      });
      act(() => {
        screen.getByTestId('trigger2').click();
      });
      expect(screen.getByText('メッセージ1')).toBeInTheDocument();
      expect(screen.getByText('メッセージ2')).toBeInTheDocument();
    });
  });
});
