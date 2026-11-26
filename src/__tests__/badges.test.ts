import { describe, expect, it } from 'vitest';
import { evaluateEligibleBadges } from '@/lib/badges';

describe('evaluateEligibleBadges', () => {
  it('awards no badges for zero activity', () => {
    const badges = evaluateEligibleBadges({
      reviewCount: 0,
      favoriteCount: 0,
      photoCount: 0,
      citiesVisited: 0,
    });
    expect(badges).toHaveLength(0);
  });

  it('awards expected badges when thresholds are met', () => {
    const badges = evaluateEligibleBadges({
      reviewCount: 5,
      favoriteCount: 3,
      photoCount: 3,
      citiesVisited: 2,
    });
    const codes = badges.map((b) => b.code);
    expect(codes).toContain('FIRST_SIP');
    expect(codes).toContain('CRITIC');
    expect(codes).toContain('CURATOR');
    expect(codes).toContain('PHOTOGRAPHER');
    expect(codes).toContain('EXPLORER');
    expect(codes).not.toContain('CONNOISSEUR');
  });
});
