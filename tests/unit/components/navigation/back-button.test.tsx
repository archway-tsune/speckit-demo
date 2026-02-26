/**
 * BackButton 単体テスト
 *
 * AC1: ラベルテキスト表示 + 左矢印 SVG アイコン存在 + クリック時に onClick ハンドラ呼び出し
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackButton } from '@/components/navigation/BackButton';

describe('BackButton', () => {
  it('should render label text', () => {
    render(<BackButton label="注文一覧に戻る" onClick={() => {}} />);
    expect(screen.getByText('注文一覧に戻る')).toBeInTheDocument();
  });

  it('should contain left arrow SVG icon', () => {
    const { container } = render(<BackButton label="戻る" onClick={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<BackButton label="戻る" onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
