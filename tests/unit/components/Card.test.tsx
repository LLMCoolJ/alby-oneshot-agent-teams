import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Card">Body</Card>);
    expect(screen.getByTestId('card-title')).toHaveTextContent('My Card');
  });

  it('renders subtitle when provided', () => {
    render(<Card title="Title" subtitle="Subtitle text">Body</Card>);
    expect(screen.getByTestId('card-subtitle')).toHaveTextContent('Subtitle text');
  });

  it('renders header action', () => {
    render(
      <Card headerAction={<button>Action</button>}>Body</Card>
    );
    expect(screen.getByTestId('card-header-action')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<Card footer={<span>Footer content</span>}>Body</Card>);
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="my-custom-class">Body</Card>);
    expect(screen.getByTestId('card').className).toContain('my-custom-class');
  });
});
