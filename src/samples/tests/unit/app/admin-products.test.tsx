/** 管理者商品ページ - SearchBar 利用テスト */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/sample/admin/products',
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import AdminProductsPage from '@/app/(samples)/sample/admin/products/page';

const productsResponse = {
  success: true,
  data: {
    products: [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'テスト商品A', price: 1000, description: '', imageUrl: '', status: 'published', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: '特別商品B', price: 2000, description: '', imageUrl: '', status: 'draft', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ],
    pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
  },
};

describe('AdminProductsPage - SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(productsResponse),
      ok: true,
    });
  });

  it('Given 管理者商品ページ, When ページ表示, Then SearchBar が存在する', async () => {
    render(<AdminProductsPage />);
    const input = await screen.findByTestId('search-input');
    expect(input).toBeInTheDocument();
  });

  it('Given 商品一覧, When 検索文字を入力して Enter, Then 一致しない商品が非表示になる', async () => {
    const user = userEvent.setup();
    render(<AdminProductsPage />);
    await screen.findByText('テスト商品A');

    const input = screen.getByTestId('search-input');
    await user.type(input, '特別{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('テスト商品A')).not.toBeInTheDocument();
    });
    expect(screen.getByText('特別商品B')).toBeInTheDocument();
  });

  it('Given フィルタ適用中, When クリアボタンをクリック, Then 全商品が表示される', async () => {
    const user = userEvent.setup();
    render(<AdminProductsPage />);
    await screen.findByText('テスト商品A');

    const input = screen.getByTestId('search-input');
    await user.type(input, '特別{Enter}');
    await waitFor(() => {
      expect(screen.queryByText('テスト商品A')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId('search-clear'));
    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });
    expect(screen.getByText('特別商品B')).toBeInTheDocument();
  });
});
