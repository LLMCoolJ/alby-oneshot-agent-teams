import type { ButtonVariant, Size } from '@/types';
import { Spinner } from './Spinner';

/** Props for the Button component */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: Size;
  /** Shows a spinner and disables the button */
  loading?: boolean;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Button content */
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-bitcoin text-white hover:bg-bitcoin-dark focus-visible:ring-bitcoin',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'py-1.5 px-3 text-sm',
  md: 'py-2 px-4 text-base',
  lg: 'py-3 px-6 text-lg',
};

/** Versatile button with variant, size, loading, and icon support */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      data-testid="button"
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'motion-reduce:transition-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" className="shrink-0" />
      ) : icon ? (
        <span className="shrink-0" data-testid="button-icon">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
