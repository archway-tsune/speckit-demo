import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  children: ReactNode;
}

const baseStyles =
  'rounded-full px-6 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles = {
  primary:
    'bg-base-900 text-white hover:bg-base-900/85 focus:ring-base-900/20',
  secondary:
    'border border-base-900/15 text-base-900 hover:bg-base-100 focus:ring-base-900/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/20',
};

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
