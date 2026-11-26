import { describe, expect, it } from 'vitest';
import {
  registerSchema,
  reviewCreateSchema,
  reviewUpdateSchema,
  shopFilterSchema,
} from '@/lib/validations';

describe('Zod validation schemas', () => {
  it('validates registration payload and lowercases email', () => {
    const parsed = registerSchema.safeParse({
      name: 'Layla',
      email: 'Layla@Example.COM',
      password: 'Password123',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe('layla@example.com');
    }
  });

  it('rejects short password on registration', () => {
    const parsed = registerSchema.safeParse({
      name: 'Layla',
      email: 'layla@example.com',
      password: '123',
    });
    expect(parsed.success).toBe(false);
  });

  it('validates review rating bounds (1-5)', () => {
    expect(
      reviewCreateSchema.safeParse({
        shopId: 'shop_1',
        rating: 5,
        comment: 'Fantastic pour-over and quiet desks.',
      }).success
    ).toBe(true);

    expect(
      reviewCreateSchema.safeParse({
        shopId: 'shop_1',
        rating: 6,
        comment: 'Too high rating',
      }).success
    ).toBe(false);
  });

  it('allows partial review updates', () => {
    expect(reviewUpdateSchema.safeParse({ rating: 4 }).success).toBe(true);
  });

  it('parses shop filter params with defaults and priorityCity', () => {
    const parsed = shopFilterSchema.parse({ q: 'elixir', minRating: '4.5', priorityCity: 'Riyadh' });
    expect(parsed.minRating).toBe(4.5);
    expect(parsed.priorityCity).toBe('Riyadh');
    expect(parsed.sort).toBe('trending');
  });
});
