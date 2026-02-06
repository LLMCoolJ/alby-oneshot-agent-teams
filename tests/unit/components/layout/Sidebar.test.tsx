import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { SCENARIOS, CONSTANTS } from '@/types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Sidebar', () => {
  it('renders all scenario links', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    SCENARIOS.forEach((scenario) => {
      expect(screen.getByText(scenario.name)).toBeInTheDocument();
    });
  });

  it('renders exactly 8 scenario nav links', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    const listItems = document.querySelectorAll('nav ul li');
    expect(listItems).toHaveLength(8);
  });

  it('renders scenario links with correct paths', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    SCENARIOS.forEach((scenario) => {
      const link = screen.getByText(scenario.name).closest('a');
      expect(link).toHaveAttribute('href', scenario.path);
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar open={true} onClose={onClose} />, { wrapper });

    await user.click(screen.getByLabelText('Close menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when a nav link is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar open={true} onClose={onClose} />, { wrapper });

    await user.click(screen.getByText(SCENARIOS[0].name));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when mobile overlay is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar open={true} onClose={onClose} />, { wrapper });

    // The overlay div has both aria-hidden="true" and the bg-slate-900/50 class
    const overlay = document.querySelector('.bg-slate-900\\/50');
    expect(overlay).toBeInTheDocument();
    await user.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render overlay when closed', () => {
    render(<Sidebar open={false} onClose={() => {}} />, { wrapper });
    // The overlay is a div with class containing bg-slate-900/50
    const overlay = document.querySelector('.bg-slate-900\\/50');
    expect(overlay).not.toBeInTheDocument();
  });

  it('renders external links with proper attributes', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });

    const faucetLink = screen.getByText('Get Testnet Sats').closest('a');
    expect(faucetLink).toHaveAttribute('target', '_blank');
    expect(faucetLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(faucetLink).toHaveAttribute('href', CONSTANTS.FAUCET_URL);
  });

  it('renders Alby SDK Docs link with proper attributes', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });

    const sdkLink = screen.getByText('Alby SDK Docs').closest('a');
    expect(sdkLink).toHaveAttribute('target', '_blank');
    expect(sdkLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(sdkLink).toHaveAttribute('href', 'https://github.com/getAlby/alby-js-sdk');
  });

  it('displays Lightning Demo heading', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    expect(screen.getByText('Lightning Demo')).toBeInTheDocument();
  });

  it('displays Alice & Bob Scenarios subtitle', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    expect(screen.getByText('Alice & Bob Scenarios')).toBeInTheDocument();
  });

  it('applies translate-x-0 when open', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    const aside = document.querySelector('aside');
    expect(aside?.className).toContain('translate-x-0');
  });

  it('applies -translate-x-full when closed', () => {
    render(<Sidebar open={false} onClose={() => {}} />, { wrapper });
    const aside = document.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');
  });

  it('renders scenario icons with img role', () => {
    render(<Sidebar open={true} onClose={() => {}} />, { wrapper });
    const icons = screen.getAllByRole('img', { hidden: true });
    expect(icons.length).toBeGreaterThanOrEqual(SCENARIOS.length);
  });
});
