import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/form/Button';

describe('Button', () => {
  // AC1: primary variant (default)
  it('renders with primary styles by default', () => {
    render(<Button>送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button.className).toContain('bg-base-900');
    expect(button.className).toContain('text-white');
    expect(button.className).toContain('rounded-full');
  });

  // AC2: secondary variant
  it('renders with secondary styles when variant="secondary"', () => {
    render(<Button variant="secondary">キャンセル</Button>);
    const button = screen.getByRole('button', { name: 'キャンセル' });
    expect(button.className).toContain('border');
    expect(button.className).toContain('border-base-900/15');
    expect(button.className).toContain('text-base-900');
  });

  // AC3: danger variant
  it('renders with danger styles when variant="danger"', () => {
    render(<Button variant="danger">削除</Button>);
    const button = screen.getByRole('button', { name: '削除' });
    expect(button.className).toContain('bg-red-600');
    expect(button.className).toContain('text-white');
  });

  // AC4: disabled state
  it('is disabled and does not fire click when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // AC5: className appended
  it('appends className to variant styles', () => {
    render(<Button className="w-full mt-3">送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button.className).toContain('w-full');
    expect(button.className).toContain('mt-3');
    expect(button.className).toContain('bg-base-900');
  });

  // AC6: HTML attributes passthrough
  it('passes through HTML button attributes', async () => {
    const handleClick = vi.fn();
    render(
      <Button type="submit" onClick={handleClick} data-testid="test-btn">
        送信
      </Button>,
    );
    const button = screen.getByTestId('test-btn');
    expect(button).toHaveAttribute('type', 'submit');
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // AC: type defaults to "button"
  it('defaults type to "button"', () => {
    render(<Button>送信</Button>);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toHaveAttribute('type', 'button');
  });
});
