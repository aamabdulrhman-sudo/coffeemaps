import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';

describe('EmptyState and ErrorState', () => {
  it('renders EmptyState with optional action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No favorites"
        description="Save some cafes first."
        actionLabel="Explore"
        onAction={onAction}
      />
    );

    expect(screen.getByText('No favorites')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorState with retry callback', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Load error" message="Failed request" onRetry={onRetry} />);

    expect(screen.getByText('Load error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
