import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop';

/**
 * Public self-service signup for coffee shops (cafe owners).
 * Creates: SHOP-role user + Shop record + an active LoyaltyProgram (default 8 stamps).
 * Platform admins can review/edit/disable afterwards.
 */
const cafeRegisterSchema = z.object({
  ownerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  shopName: z.string().trim().min(2, 'Cafe name must be at least 2 characters').max(120),
  city: z.string().trim().min(2, 'City is required').max(80),
  address: z.string().trim().min(4, 'Address is required').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  openingHours: z.string().trim().min(3, 'Opening hours are required').max(120),
  googleMapsUrl: z.string().url('Must be a valid Google Maps URL'),
  imageUrl: z.string().url('Must be a valid image URL').optional().nullable().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  stampsGoal: z.coerce.number().int().min(3).max(30).optional().default(8),
  reward: z.string().trim().min(3, 'Reward description is required').max(160),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cafeRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid registration data' },
        { status: 400 }
      );
    }

    const { ownerName, email, password, shopName, reward, imageUrl, ...rest } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: ownerName,
        email,
        passwordHash,
        role: 'SHOP',
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const baseSlug = slugify(`${shopName}-${rest.city}`);
    const slugClash = await prisma.shop.findUnique({ where: { slug: baseSlug } });
    const slug = slugClash ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const shop = await prisma.shop.create({
      data: {
        name: shopName,
        slug,
        description: rest.description,
        address: rest.address,
        city: rest.city,
        latitude: rest.latitude ?? 24.7136,
        longitude: rest.longitude ?? 46.6753,
        imageUrl: imageUrl || FALLBACK_IMAGE,
        openingHours: rest.openingHours,
        googleMapsUrl: rest.googleMapsUrl,
      },
      select: { id: true, name: true, slug: true },
    });

    await prisma.user.update({ where: { id: user.id }, data: { shopId: shop.id } });

    await prisma.loyaltyProgram.create({
      data: {
        shopId: shop.id,
        stampsGoal: rest.stampsGoal,
        reward,
        active: true,
      },
    });

    return NextResponse.json({ user, shop }, { status: 201 });
  } catch (error) {
    console.error('POST /api/auth/cafe-register error:', error);
    return NextResponse.json({ error: 'Failed to register the cafe' }, { status: 500 });
  }
}
