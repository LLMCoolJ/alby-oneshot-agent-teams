import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout', () => {
  it('renders children in the main content area', () => {
    render(<Layout><div>Test Content</div></Layout>, { wrapper });
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Layout>
        <div>Child 1</div>
        <div>Child 2</div>
      </Layout>,
      { wrapper },
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('renders Lightning Demo title in header and sidebar', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    const titles = screen.getAllByText('Lightning Demo');
    expect(titles.length).toBeGreaterThanOrEqual(2);
  });

  it('shows mobile menu button with Open menu label', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('shows Testnet badge in mobile header', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('renders sidebar component', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    // Sidebar renders the "Lightning Demo" heading and scenario links
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('opens sidebar when menu button is clicked', async () => {
    const user = userEvent.setup();
    render(<Layout><div>Content</div></Layout>, { wrapper });

    const menuButton = screen.getByLabelText('Open menu');
    await user.click(menuButton);

    // When open, the mobile overlay div should be visible
    const overlay = document.querySelector('.bg-slate-900\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('renders main element with correct layout classes', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('lg:pl-64');
  });

  it('wraps in min-h-screen container', () => {
    const { container } = render(<Layout><div>Content</div></Layout>, { wrapper });
    const outerDiv = container.firstElementChild;
    expect(outerDiv).toHaveClass('min-h-screen');
    expect(outerDiv).toHaveClass('bg-slate-50');
  });

  it('renders header element for mobile', () => {
    render(<Layout><div>Content</div></Layout>, { wrapper });
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('lg:hidden');
  });
});
