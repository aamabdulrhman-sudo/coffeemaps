import { describe, expect, it, vi, beforeEach } from 'vitest';
import { findNearestKnownCity, normalizeCityName, resolveCityFromCoords } from '@/lib/geocoding';

const SAMPLE_SHOPS = [
  { city: 'Riyadh', latitude: 24.7009, longitude: 46.6852 },
  { city: 'Jeddah', latitude: 21.5597, longitude: 39.1563 },
  { city: 'Dubai', latitude: 25.1408, longitude: 55.2261 },
];

describe('geocoding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes city aliases and known cities', () => {
    expect(normalizeCityName('Ar Riyad', ['Riyadh', 'Jeddah'])).toBe('Riyadh');
    expect(normalizeCityName('Al Madinah', ['Medina', 'Riyadh'])).toBe('Medina');
    expect(normalizeCityName('الرياض', ['Riyadh'])).toBe('Riyadh');
    expect(normalizeCityName('Greater London', ['London'])).toBe('London');
  });

  it('finds nearest known city within radius', () => {
    expect(findNearestKnownCity(24.7136, 46.6753, SAMPLE_SHOPS)).toBe('Riyadh');
    expect(findNearestKnownCity(0, 0, SAMPLE_SHOPS)).toBeNull();
  });

  it('resolves city from Nominatim response or falls back cleanly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ address: { city: 'Ar Riyad' } }),
    } as Response);

    const city = await resolveCityFromCoords(24.7136, 46.6753, SAMPLE_SHOPS);
    expect(city).toBe('Riyadh');

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network down'));
    const fallbackCity = await resolveCityFromCoords(21.56, 39.16, SAMPLE_SHOPS);
    expect(fallbackCity).toBe('Jeddah');
  });
});
