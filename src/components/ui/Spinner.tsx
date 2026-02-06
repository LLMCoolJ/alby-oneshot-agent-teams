import type { Size } from '@/types';

/** Props for the Spinner component */
export interface SpinnerProps {
  /** Spinner diameter size */
  size?: Size;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

/** Accessible animated loading spinner */
export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      data-testid="spinner"
      className={['inline-flex items-center justify-center', className].join(' ')}
    >
      <span
        className={[
          'animate-spin rounded-full border-bitcoin border-t-transparent',
          'motion-reduce:animate-[spin_1.5s_linear_infinite]',
          sizeClasses[size],
        ].join(' ')}
      />
      <span className="sr-only">Loading</span>
    </span>
  );
}
