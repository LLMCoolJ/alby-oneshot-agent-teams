import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionLog } from '@/components/transaction/TransactionLog';
import type { LogEntry } from '@/types';

describe('TransactionLog', () => {
  it('shows empty state when no entries', () => {
    render(<TransactionLog entries={[]} />);
    expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
  });

  it('shows empty state message text', () => {
    render(<TransactionLog entries={[]} />);
    expect(screen.getByText('No events yet. Start a transaction to see activity.')).toBeInTheDocument();
  });

  it('renders the Transaction Log heading when empty', () => {
    render(<TransactionLog entries={[]} />);
    expect(screen.getByText('Transaction Log')).toBeInTheDocument();
  });

  it('renders the Transaction Log heading with entries', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Test', type: 'info' },
    ];
    render(<TransactionLog entries={entries} />);
    expect(screen.getByText('Transaction Log')).toBeInTheDocument();
  });

  it('renders log entries', () => {
    const entries: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(),
        message: 'Payment sent successfully',
        type: 'success',
      },
      {
        id: '2',
        timestamp: new Date(),
        message: 'Creating invoice...',
        type: 'info',
      },
    ];

    render(<TransactionLog entries={entries} />);

    expect(screen.getByText('Payment sent successfully')).toBeInTheDocument();
    expect(screen.getByText('Creating invoice...')).toBeInTheDocument();
  });

  it('renders a badge for each entry', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Success!', type: 'success' },
      { id: '2', timestamp: new Date(), message: 'Info message', type: 'info' },
    ];

    render(<TransactionLog entries={entries} />);
    const badges = screen.getAllByTestId('badge');
    expect(badges).toHaveLength(2);
  });

  it('renders badge with correct type label', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Error!', type: 'error' },
    ];

    render(<TransactionLog entries={entries} />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('displays timestamp for each entry', () => {
    const now = new Date('2024-01-15T10:30:00');
    const entries: LogEntry[] = [
      { id: '1', timestamp: now, message: 'Test', type: 'info' },
    ];

    render(<TransactionLog entries={entries} />);
    expect(screen.getByText(now.toLocaleTimeString())).toBeInTheDocument();
  });

  it('renders multiple entries in order', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'First entry', type: 'info' },
      { id: '2', timestamp: new Date(), message: 'Second entry', type: 'success' },
      { id: '3', timestamp: new Date(), message: 'Third entry', type: 'warning' },
    ];

    const { container } = render(<TransactionLog entries={entries} />);
    const html = container.innerHTML;
    expect(html.indexOf('First entry')).toBeLessThan(html.indexOf('Second entry'));
    expect(html.indexOf('Second entry')).toBeLessThan(html.indexOf('Third entry'));
  });

  it('applies default maxHeight of 300px', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Test', type: 'info' },
    ];

    const { container } = render(<TransactionLog entries={entries} />);
    const scrollContainer = container.querySelector('[style]');
    expect(scrollContainer).toHaveStyle({ maxHeight: '300px' });
  });

  it('applies custom maxHeight', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Test', type: 'info' },
    ];

    const { container } = render(<TransactionLog entries={entries} maxHeight="500px" />);
    const scrollContainer = container.querySelector('[style]');
    expect(scrollContainer).toHaveStyle({ maxHeight: '500px' });
  });

  it('renders all four log types correctly', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Info msg', type: 'info' },
      { id: '2', timestamp: new Date(), message: 'Success msg', type: 'success' },
      { id: '3', timestamp: new Date(), message: 'Error msg', type: 'error' },
      { id: '4', timestamp: new Date(), message: 'Warning msg', type: 'warning' },
    ];

    render(<TransactionLog entries={entries} />);
    expect(screen.getByText('Info msg')).toBeInTheDocument();
    expect(screen.getByText('Success msg')).toBeInTheDocument();
    expect(screen.getByText('Error msg')).toBeInTheDocument();
    expect(screen.getByText('Warning msg')).toBeInTheDocument();
  });

  it('does not render scrollable container when empty', () => {
    const { container } = render(<TransactionLog entries={[]} />);
    const scrollContainer = container.querySelector('[style]');
    expect(scrollContainer).not.toBeInTheDocument();
  });
});
