import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '@/components/ui/CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Mock execCommand for the fallback copy path in jsdom
    document.execCommand = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('copies value to clipboard on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton value="lnbc1234" />);
    await user.click(screen.getByTestId('copy-button'));
    // After clicking, the button should switch to "Copied!" state
    // which proves the copy operation succeeded
    expect(screen.getByTestId('copy-button')).toHaveAttribute('title', 'Copied!');
  });

  it('shows copied state after click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton value="test" label="Copy" />);
    const btn = screen.getByTestId('copy-button');
    expect(btn).toHaveAttribute('title', 'Copy');
    await user.click(btn);
    expect(btn).toHaveAttribute('title', 'Copied!');
    expect(btn.className).toContain('text-green-600');
  });

  it('calls onCopied callback', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCopied = vi.fn();
    render(<CopyButton value="test" onCopied={onCopied} />);
    await user.click(screen.getByTestId('copy-button'));
    expect(onCopied).toHaveBeenCalledTimes(1);
  });

  it('resets state after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton value="test" label="Copy" />);
    const btn = screen.getByTestId('copy-button');
    await user.click(btn);
    expect(btn).toHaveAttribute('title', 'Copied!');
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(btn).toHaveAttribute('title', 'Copy');
  });
});
