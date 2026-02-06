import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('renders with spin animation', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('spinner');
    // The inner span has the animate-spin class
    const animatedEl = spinner.querySelector('.animate-spin');
    expect(animatedEl).toBeTruthy();
  });

  it('has accessible role', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    // sr-only loading text
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { rerender } = render(<Spinner size="sm" />);
    let inner = screen.getByTestId('spinner').querySelector('.animate-spin')!;
    expect(inner.className).toContain('h-4');
    expect(inner.className).toContain('w-4');

    rerender(<Spinner size="md" />);
    inner = screen.getByTestId('spinner').querySelector('.animate-spin')!;
    expect(inner.className).toContain('h-6');
    expect(inner.className).toContain('w-6');

    rerender(<Spinner size="lg" />);
    inner = screen.getByTestId('spinner').querySelector('.animate-spin')!;
    expect(inner.className).toContain('h-8');
    expect(inner.className).toContain('w-8');
  });
});
