/** 商品登録ページ - FormField 利用テスト */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import NewProductPage from '@/app/(samples)/sample/admin/products/new/page';

describe('NewProductPage - FormField', () => {
  it('Given 商品登録フォーム, When ページ表示, Then TextInput で商品名入力欄がある', () => {
    render(<NewProductPage />);
    const nameInput = screen.getByLabelText(/商品名/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('Given 商品登録フォーム, When ページ表示, Then TextInput で価格入力欄がある', () => {
    render(<NewProductPage />);
    const priceInput = screen.getByLabelText(/価格/i);
    expect(priceInput).toBeInTheDocument();
    expect(priceInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('Given 商品登録フォーム, When ページ表示, Then TextArea で説明入力欄がある', () => {
    render(<NewProductPage />);
    const descInput = screen.getByLabelText(/説明/i);
    expect(descInput).toBeInTheDocument();
    expect(descInput.tagName).toBe('TEXTAREA');
    expect(descInput).toHaveAttribute('aria-invalid', 'false');
  });
});
