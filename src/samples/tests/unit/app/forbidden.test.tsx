/** Forbidden ページ - Forbidden コンポーネント利用テスト */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import ForbiddenPage from '@/app/(samples)/sample/forbidden/page';

describe('ForbiddenPage - Forbidden コンポーネント', () => {
  it('Given 権限エラー, When ページ表示, Then role="alert" で権限エラーを表示する', () => {
    render(<ForbiddenPage />);
    expect(screen.getByRole('alert', { name: /権限エラー/i })).toBeInTheDocument();
  });

  it('Given 権限エラー, When ページ表示, Then 権限不足メッセージを表示する', () => {
    render(<ForbiddenPage />);
    expect(screen.getByText(/権限がありません|アクセス権限がありません/)).toBeInTheDocument();
  });

  it('Given 権限エラー, When ページ表示, Then ホームに戻るリンクがある', () => {
    render(<ForbiddenPage />);
    const link = screen.getByRole('link', { name: /ホームに戻る|前のページに戻る/i });
    expect(link).toBeInTheDocument();
  });
});
