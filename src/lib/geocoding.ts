import { haversineDistanceKm } from '@/lib/utils';

export interface CityCoordinate {
  city: string;
  latitude: number;
  longitude: number;
}

const CITY_ALIASES: Record<string, string> = {
  'ar riyad': 'Riyadh',
  'riyadh region': 'Riyadh',
  الرياض: 'Riyadh',
  'al madinah': 'Medina',
  'al-madinah': 'Medina',
  'madinah': 'Medina',
  'al madinah al munawwarah': 'Medina',
  'المدينة المنورة': 'Medina',
  'jiddah': 'Jeddah',
  جدة: 'Jeddah',
  'dubayy': 'Dubai',
  دبي: 'Dubai',
  'greater london': 'London',
  'city of london': 'London',
  'new york city': 'New York',
  'manhattan': 'New York',
  'brooklyn': 'New York',
  'shibuya': 'Tokyo',
  'tokyo metropolis': 'Tokyo',
};

/**
 * Matches a raw geocoded city string against known CoffeeMap cities or aliases.
 */
export function normalizeCityName(rawCity: string, knownCities: string[]): string {
  const cleaned = rawCity.trim();
  const lower = cleaned.toLowerCase();

  if (CITY_ALIASES[lower]) {
    return CITY_ALIASES[lower];
  }

  for (const known of knownCities) {
    const knownLower = known.toLowerCase();
    if (lower === knownLower || lower.includes(knownLower) || knownLower.includes(lower)) {
      return known;
    }
  }

  return cleaned;
}

/**
 * Resolves the user's city from coordinates using OpenStreetMap Nominatim
 * with a deterministic nearest-known-shop fallback (within 100 km).
 */
export async function resolveCityFromCoords(
  lat: number,
  lng: number,
  knownShops: CityCoordinate[]
): Promise<string | null> {
  const knownCities = Array.from(new Set(knownShops.map((s) => s.city)));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&accept-language=en`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CoffeeMap/1.0 (https://coffeemap.app)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as {
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          state?: string;
        };
      };

      const candidate =
        data.address?.city ??
        data.address?.town ??
        data.address?.municipality ??
        data.address?.village ??
        data.address?.state;

      if (candidate) {
        return normalizeCityName(candidate, knownCities);
      }
    }
  } catch {
    // Fall back to nearest known shop coordinates below
  }

  return findNearestKnownCity(lat, lng, knownShops);
}

export function findNearestKnownCity(
  lat: number,
  lng: number,
  knownShops: CityCoordinate[],
  maxDistanceKm = 100
): string | null {
  let nearestCity: string | null = null;
  let minDist = Infinity;

  for (const shop of knownShops) {
    const d = haversineDistanceKm(lat, lng, shop.latitude, shop.longitude);
    if (d < minDist) {
      minDist = d;
      nearestCity = shop.city;
    }
  }

  return minDist <= maxDistanceKm ? nearestCity : null;
}
