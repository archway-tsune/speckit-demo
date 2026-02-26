/**
 * useFetch カスタムフック 単体テスト
 *
 * AC1: ローディング → データ表示遷移
 * AC2: エラー応答時のエラーメッセージ
 * AC3: 401 + loginUrl → リダイレクト
 * AC3a: 401 + loginUrl 未指定 → エラー扱い
 * AC4: パラメータ変更 → 自動再 fetch
 * AC5: パラメータ不変 → 不要再 fetch なし
 * Edge: アンマウント後の状態更新防止
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFetch } from '@/components/hooks/useFetch';

// global fetch モック
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
  // window.location モック
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '' },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** ApiResponse 成功レスポンスを返すヘルパー */
function mockSuccessResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data }),
  };
}

/** ApiResponse エラーレスポンスを返すヘルパー */
function mockErrorResponse(message: string, status = 400) {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      error: { code: 'VALIDATION_ERROR', message },
    }),
  };
}

describe('useFetch', () => {
  // AC1: ローディング → データ表示遷移
  it('should start with isLoading=true and transition to data after successful fetch', async () => {
    const products = [{ id: '1', name: 'テスト商品' }];
    mockFetch.mockResolvedValueOnce(mockSuccessResponse(products));

    const { result } = renderHook(() => useFetch<typeof products>('/api/products'));

    // 初期状態: isLoading=true, data=null
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();

    // データ取得後: isLoading=false, data に値が入る
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data).toEqual(products);
    expect(result.current.error).toBeNull();
  });

  // AC2: エラー応答時のエラーメッセージ
  it('should set error message when API returns error response', async () => {
    mockFetch.mockResolvedValueOnce(mockErrorResponse('バリデーションエラー'));

    const { result } = renderHook(() => useFetch('/api/products'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBe('バリデーションエラー');
    expect(result.current.data).toBeNull();
  });

  // AC3: 401 + loginUrl → リダイレクト
  it('should redirect to loginUrl when 401 response and loginUrl is specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' },
      }),
    });

    renderHook(() =>
      useFetch('/api/cart', undefined, { loginUrl: '/sample/login' }),
    );

    await waitFor(() => {
      expect(window.location.href).toBe('/sample/login');
    });
  });

  // AC3a: 401 + loginUrl 未指定 → エラー扱い
  it('should treat 401 as error when loginUrl is not specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' },
      }),
    });

    const { result } = renderHook(() => useFetch('/api/cart'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBe('ログインが必要です');
    expect(window.location.href).toBe('');
  });

  // AC4: パラメータ変更 → 自動再 fetch
  it('should refetch automatically when params change', async () => {
    const page1Data = { items: ['a'] };
    const page2Data = { items: ['b'] };
    mockFetch
      .mockResolvedValueOnce(mockSuccessResponse(page1Data))
      .mockResolvedValueOnce(mockSuccessResponse(page2Data));

    const { result, rerender } = renderHook(
      ({ params }) => useFetch<typeof page1Data>('/api/products', params),
      { initialProps: { params: { page: '1' } } },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(page1Data);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products?page=1',
      expect.any(Object),
    );

    // パラメータ変更 → 再 fetch
    rerender({ params: { page: '2' } });

    await waitFor(() => {
      expect(result.current.data).toEqual(page2Data);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/products?page=2',
      expect.any(Object),
    );
  });

  // AC5: パラメータ不変 → 不要再 fetch なし
  it('should not refetch when params reference changes but values are same', async () => {
    mockFetch.mockResolvedValueOnce(mockSuccessResponse({ items: [] }));

    const { result, rerender } = renderHook(
      ({ params }) => useFetch('/api/products', params),
      { initialProps: { params: { page: '1' } } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 同じ値の新しいオブジェクト → 再 fetch しない
    rerender({ params: { page: '1' } });

    // 少し待っても fetch が増えないことを確認
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Edge: アンマウント後の状態更新防止
  it('should not update state after unmount', async () => {
    let resolvePromise: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { unmount } = renderHook(() => useFetch('/api/products'));

    // アンマウント
    unmount();

    // fetch が解決してもエラーが出ないこと
    act(() => {
      resolvePromise!(mockSuccessResponse({ items: [] }));
    });

    // エラーなく完了すれば OK（state update warning が出ないこと）
  });

  // refetch 関数のテスト
  it('should refetch data when refetch is called', async () => {
    const initialData = { count: 1 };
    const refreshedData = { count: 2 };
    mockFetch
      .mockResolvedValueOnce(mockSuccessResponse(initialData))
      .mockResolvedValueOnce(mockSuccessResponse(refreshedData));

    const { result } = renderHook(() =>
      useFetch<typeof initialData>('/api/data'),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(initialData);
    });

    // refetch 呼び出し
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(refreshedData);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // fetch 例外（ネットワークエラー）のテスト
  it('should handle fetch exceptions as error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFetch('/api/products'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });
});
