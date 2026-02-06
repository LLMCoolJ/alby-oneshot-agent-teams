import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByTestId('input-label')).toHaveTextContent('Email');
  });

  it('renders error message when provided', () => {
    render(<Input error="Required field" />);
    expect(screen.getByTestId('input-error')).toHaveTextContent('Required field');
  });

  it('renders hint when no error', () => {
    render(<Input hint="Enter your email" />);
    expect(screen.getByTestId('input-hint')).toHaveTextContent('Enter your email');
  });

  it('applies error styles when error is set', () => {
    render(<Input label="Field" error="Bad value" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    // The wrapper div has the border-red-500 class
    expect(input.parentElement!.className).toContain('border-red-500');
  });

  it('forwards ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByTestId('input'));
  });

  it('handles onChange events', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByTestId('input'), 'hello');
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('renders left addon', () => {
    render(<Input leftAddon={<span>$</span>} />);
    expect(screen.getByTestId('input-left-addon')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders right addon', () => {
    render(<Input rightAddon={<span>sats</span>} />);
    expect(screen.getByTestId('input-right-addon')).toBeInTheDocument();
    expect(screen.getByText('sats')).toBeInTheDocument();
  });
});
