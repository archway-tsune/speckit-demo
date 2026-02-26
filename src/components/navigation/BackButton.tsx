'use client';

/**
 * BackButton — 左矢印アイコン付き戻るボタン
 */

export interface BackButtonProps {
  /** ボタンのラベルテキスト */
  label: string;
  /** クリック時のコールバック */
  onClick: () => void;
}

export function BackButton({ label, onClick }: BackButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex items-center gap-2 text-sm text-base-900/60 transition-colors duration-200 hover:text-base-900"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
