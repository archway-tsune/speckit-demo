/**
 * AlertBanner 単体テスト
 *
 * AC2: variant="error" → 赤系背景クラス + メッセージ表示
 * AC3: variant="success" → 緑系背景クラス + メッセージ表示
 * Edge: message が falsy → バナー非表示
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertBanner } from '@/components/feedback/AlertBanner';

describe('AlertBanner', () => {
  it('should render error variant with red background class and message', () => {
    const { container } = render(<AlertBanner variant="error" message="エラーが発生しました" />);
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toMatch(/red/);
  });

  it('should render success variant with green background class and message', () => {
    const { container } = render(<AlertBanner variant="success" message="成功しました" />);
    expect(screen.getByText('成功しました')).toBeInTheDocument();
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toMatch(/green/);
  });

  it('should not render when message is empty string', () => {
    const { container } = render(<AlertBanner variant="error" message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when message is undefined', () => {
    const { container } = render(<AlertBanner variant="error" />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when message is null', () => {
    const { container } = render(<AlertBanner variant="error" message={null} />);
    expect(container.firstChild).toBeNull();
  });
});
