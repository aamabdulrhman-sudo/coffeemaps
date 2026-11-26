import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReviewForm } from '@/components/reviews/review-form';
import { LanguageProvider } from '@/components/language-provider';

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates minimum comment length before submitting', async () => {
    const onSuccess = vi.fn();
    render(
      <LanguageProvider>
        <ReviewForm shopId="shop_1" onSuccess={onSuccess} />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/Your Review/i);
    fireEvent.change(textarea, { target: { value: 'Hi' } });
    fireEvent.submit(textarea.closest('form')!);

    expect(await screen.findByText(/at least 5 characters/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('submits rating and review text to /api/reviews', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ review: { id: 'rev_1' } }),
    } as Response);

    const onSuccess = vi.fn();
    render(
      <LanguageProvider>
        <ReviewForm shopId="shop_1" onSuccess={onSuccess} />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
    fireEvent.change(screen.getByLabelText(/Headline/i), {
      target: { value: 'Cozy spot' },
    });
    fireEvent.change(screen.getByLabelText(/Your Review/i), {
      target: { value: 'Great latte art and fast WiFi for studying.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Post review/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/reviews',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
