import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const reviewCreateSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  rating: z.coerce.number().int().min(1, 'Rating must be 1 to 5').max(5, 'Rating must be 1 to 5'),
  title: z.string().trim().max(120, 'Title must be under 120 characters').optional().nullable(),
  comment: z
    .string()
    .trim()
    .min(5, 'Review must be at least 5 characters')
    .max(2000, 'Review cannot exceed 2000 characters'),
  photoUrls: z
    .array(z.string().min(1))
    .max(5, 'Maximum 5 photos per review')
    .optional()
    .default([]),
});

export const reviewUpdateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().min(5).max(2000).optional(),
});

export const shopFilterSchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  priorityCity: z.string().trim().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  tags: z.string().trim().optional(),
  sort: z.enum(['trending', 'rating', 'nearest', 'reviews']).optional().default('trending'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).optional(),
});

export const shopCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
  address: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80).default('Saudi Arabia'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  imageUrl: z.string().url('Must be a valid image URL'),
  openingHours: z.string().trim().min(3).max(120),
  googleMapsUrl: z.string().url('Must be a valid Google Maps URL'),
  tagSlugs: z.array(z.string()).min(1, 'Select at least one tag'),
});

export const favoriteToggleSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  bio: z.string().trim().max(300, 'Bio must be under 300 characters').optional().nullable(),
  city: z.string().trim().max(80, 'City must be under 80 characters').optional().nullable(),
  image: z.string().url('Must be a valid URL').or(z.literal('')).optional().nullable(),
});

const adBannerBaseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200).optional().nullable(),
  imageUrl: z.string().url('Must be a valid image URL').optional().nullable().or(z.literal('')),
  linkUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  shopId: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
  priority: z.coerce.number().int().min(0).max(1000).optional().default(0),
});

export const adBannerCreateSchema = adBannerBaseSchema.refine(
  (data) => Boolean(data.shopId) || Boolean(data.imageUrl),
  {
    message: 'Select a featured coffee shop or provide a banner image',
    path: ['shopId'],
  }
);

export const adBannerUpdateSchema = adBannerBaseSchema.partial();

export const loyaltyProgramSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  stampsGoal: z.coerce.number().int().min(3, 'Minimum 3 stamps').max(30, 'Maximum 30 stamps'),
  reward: z.string().trim().min(3, 'Reward description required').max(160),
  active: z.boolean().optional().default(true),
});

export const loyaltyCheckInSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
});

export const adminSetupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  setupToken: z.string().min(1, 'Setup token is required'),
});

export const adminRoleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SHOP']),
  // Required when role = SHOP: the cafe this staff account operates
  shopId: z.string().optional().nullable(),
});

export const adminShopUpdateSchema = shopCreateSchema.partial();
