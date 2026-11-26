import { describe, expect, it } from 'vitest';
import { formatDistance, formatRating, haversineDistanceKm, slugify } from '@/lib/utils';

describe('utils', () => {
  it('calculates haversine distance accurately between Riyadh and Jeddah', () => {
    const distance = haversineDistanceKm(24.7136, 46.6753, 21.4858, 39.1925);
    expect(distance).toBeGreaterThan(840);
    expect(distance).toBeLessThan(860);
  });

  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceKm(24.7, 46.6, 24.7, 46.6)).toBe(0);
  });

  it('formats ratings cleanly', () => {
    expect(formatRating(4.85)).toBe('4.9');
    expect(formatRating(0)).toBe('New');
  });

  it('formats distances in meters and kilometers', () => {
    expect(formatDistance(0.45)).toBe('450 m away');
    expect(formatDistance(3.42)).toBe('3.4 km away');
    expect(formatDistance(null)).toBeNull();
  });

  it('slugifies shop names', () => {
    expect(slugify('Elixir Bunn — Al Olaya!')).toBe('elixir-bunn-al-olaya');
  });
});
