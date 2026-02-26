'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * useFormSubmit 戻り値
 */
export interface UseFormSubmitResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (fn: () => Promise<void>) => Promise<void>;
}

/**
 * フォーム送信カスタムフック
 *
 * isSubmitting + error + submit パターンを共通化。
 * ダブルサブミット防止、エラーハンドリング付き。
 */
export function useFormSubmit(): UseFormSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const submit = useCallback(async (fn: () => Promise<void>) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await fn();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('送信に失敗しました');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, submit };
}
