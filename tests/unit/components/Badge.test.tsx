import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('bg-slate-100');
    expect(badge.className).toContain('text-slate-800');
  });

  it('applies correct variant colors', () => {
    const { rerender } = render(<Badge variant="success">OK</Badge>);
    expect(screen.getByTestId('badge').className).toContain('bg-green-100');
    expect(screen.getByTestId('badge').className).toContain('text-green-800');

    rerender(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByTestId('badge').className).toContain('bg-yellow-100');

    rerender(<Badge variant="error">Err</Badge>);
    expect(screen.getByTestId('badge').className).toContain('bg-red-100');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByTestId('badge').className).toContain('bg-blue-100');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByTestId('badge').className).toContain('text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByTestId('badge').className).toContain('text-sm');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByTestId('badge').className).toContain('text-base');
  });
});
