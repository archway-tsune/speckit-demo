'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch オプション
 */
export interface UseFetchOptions {
  /** 401 レスポンス時のリダイレクト先 URL。未指定時はエラーとして扱う */
  loginUrl?: string;
}

/**
 * useFetch 戻り値
 */
export interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * データ取得カスタムフック
 *
 * URL + パラメータオブジェクトを受け取り、ApiResponse エンベロープを自動解析する。
 * パラメータ変更時に自動再 fetch。loginUrl 指定時は 401 でリダイレクト。
 */
export function useFetch<T>(
  url: string,
  params?: Record<string, string>,
  options?: UseFetchOptions,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const paramsKey = JSON.stringify(params ?? {});

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      const fullUrl = url + queryString;

      const res = await fetch(fullUrl, { signal });

      if (!mountedRef.current) return;

      // 401 処理
      if (res.status === 401) {
        if (options?.loginUrl) {
          window.location.href = options.loginUrl;
          return;
        }
        // loginUrl 未指定 → エラーとして扱う
        const body = await res.json();
        setError(body?.error?.message ?? 'ログインが必要です');
        setIsLoading(false);
        return;
      }

      const body = await res.json();

      if (!mountedRef.current) return;

      if (body.success && 'data' in body) {
        setData(body.data);
        setError(null);
      } else {
        setError(body?.error?.message ?? 'データの取得に失敗しました');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('データの取得に失敗しました');
    } finally {
      if (mountedRef.current && !signal?.aborted) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, options?.loginUrl]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
