import React from 'react';
import type { Size } from '@/types';

/** Props for the Input component */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label rendered above the input */
  label?: string;
  /** Error message shown below the input; applies error styling */
  error?: string;
  /** Hint text shown below the input when no error */
  hint?: string;
  /** Size of the input */
  size?: Size;
  /** Content rendered inside the input on the left */
  leftAddon?: React.ReactNode;
  /** Content rendered inside the input on the right */
  rightAddon?: React.ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: 'py-1.5 px-3 text-sm',
  md: 'py-2 px-4 text-base',
  lg: 'py-3 px-6 text-lg',
};

/** Text input with label, error/hint messaging, addons, and forwardRef support */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    size = 'md',
    leftAddon,
    rightAddon,
    className = '',
    id,
    ...rest
  },
  ref,
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const hintId = hint && !error && inputId ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
          data-testid="input-label"
        >
          {label}
        </label>
      )}
      <div
        className={[
          'flex items-center rounded-lg border transition-colors',
          'focus-within:ring-2 focus-within:ring-bitcoin focus-within:border-bitcoin',
          'motion-reduce:transition-none',
          error ? 'border-red-500' : 'border-slate-300',
        ].join(' ')}
      >
        {leftAddon && (
          <span className="flex items-center pl-3 text-slate-500" data-testid="input-left-addon">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          data-testid="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId || hintId || undefined}
          className={[
            'w-full bg-transparent outline-none',
            sizeClasses[size],
            leftAddon ? 'pl-2' : '',
            rightAddon ? 'pr-2' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightAddon && (
          <span className="flex items-center pr-3 text-slate-500" data-testid="input-right-addon">
            {rightAddon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert" data-testid="input-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-slate-500" data-testid="input-hint">
          {hint}
        </p>
      )}
    </div>
  );
});
