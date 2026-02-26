/**
 * useFormSubmit カスタムフック 単体テスト
 *
 * AC1: 送信開始 → isSubmitting=true、完了後 → isSubmitting=false
 * AC2: API エラー時 → error にメッセージ設定
 * Edge: ダブルサブミット防止（isSubmitting 中に submit 再呼び出し → 無視）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFormSubmit } from '@/components/hooks/useFormSubmit';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useFormSubmit', () => {
  // AC1: 送信開始 → isSubmitting=true、完了後 → isSubmitting=false
  it('should set isSubmitting=true during submit and false after completion', async () => {
    const { result } = renderHook(() => useFormSubmit());

    expect(result.current.isSubmitting).toBe(false);

    let resolvePromise: () => void;
    const fn = vi.fn(
      () => new Promise<void>((resolve) => { resolvePromise = resolve; }),
    );

    act(() => {
      result.current.submit(fn);
    });

    // submit 実行中は isSubmitting=true
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    // 完了
    await act(async () => {
      resolvePromise!();
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // AC1: 成功時にエラーがクリアされること
  it('should clear previous error on successful submit', async () => {
    const { result } = renderHook(() => useFormSubmit());

    // まずエラーを発生させる
    await act(async () => {
      await result.current.submit(async () => {
        throw new Error('最初のエラー');
      });
    });

    expect(result.current.error).toBe('最初のエラー');

    // 成功する送信で error がクリアされること
    await act(async () => {
      await result.current.submit(async () => {
        // 成功
      });
    });

    expect(result.current.error).toBeNull();
  });

  // AC2: API エラー時 → error にメッセージ設定
  it('should set error message when submit function throws', async () => {
    const { result } = renderHook(() => useFormSubmit());

    await act(async () => {
      await result.current.submit(async () => {
        throw new Error('送信に失敗しました');
      });
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe('送信に失敗しました');
  });

  // AC2: Error でないオブジェクトが throw された場合
  it('should set generic error message when non-Error is thrown', async () => {
    const { result } = renderHook(() => useFormSubmit());

    await act(async () => {
      await result.current.submit(async () => {
        throw 'string error';
      });
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  // Edge: ダブルサブミット防止
  it('should ignore subsequent submit calls while submitting', async () => {
    const { result } = renderHook(() => useFormSubmit());

    const firstFn = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
    const secondFn = vi.fn(async () => {});

    act(() => {
      result.current.submit(firstFn);
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    // isSubmitting 中の二重呼び出し → 無視される
    await act(async () => {
      await result.current.submit(secondFn);
    });

    expect(secondFn).not.toHaveBeenCalled();

    // 最初の送信完了を待つ
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });

    expect(firstFn).toHaveBeenCalledTimes(1);
  });
});
