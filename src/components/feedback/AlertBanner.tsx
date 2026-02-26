'use client';

/**
 * AlertBanner — エラー/成功バリアントのバナー
 */

export interface AlertBannerProps {
  /** 表示メッセージ。falsy の場合はバナーを表示しない */
  message?: string | null;
  /** バリアント: 'error' で赤背景、'success' で緑背景 */
  variant: 'error' | 'success';
}

const variantClasses = {
  error: 'bg-red-50 text-red-600',
  success: 'bg-green-50 text-green-600',
} as const;

export function AlertBanner({ message, variant }: AlertBannerProps): JSX.Element | null {
  if (!message) return null;

  return (
    <div className={`mb-6 rounded-md p-4 text-sm ${variantClasses[variant]}`}>
      {message}
    </div>
  );
}
