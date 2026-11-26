import { describe, expect, it } from 'vitest';
import { buildDeterministicSummary } from '@/lib/ai-summary';

describe('buildDeterministicSummary', () => {
  it('summarizes themes and rating sentiment from reviews', () => {
    const summary = buildDeterministicSummary('Elixir Bunn', [
      { rating: 5, title: 'Great WiFi', comment: 'Super fast wifi and quiet laptop workspace.' },
      { rating: 5, title: 'Amazing V60', comment: 'Craft espresso and pour over beans are top tier.' },
    ]);

    expect(summary).toContain('Elixir Bunn');
    expect(summary).toContain('5/5');
    expect(summary).toContain('overwhelmingly positive');
    expect(summary).toContain('fast WiFi');
  });
});
