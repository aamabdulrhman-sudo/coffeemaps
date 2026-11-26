import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { shopCreateSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    const shops = await prisma.shop.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        tags: true,
        loyaltyProgram: true,
        _count: { select: { reviews: true, favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error('GET /api/admin/shops error:', error);
    return NextResponse.json({ error: 'Failed to load shops' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const parsed = shopCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid shop data' },
        { status: 400 }
      );
    }

    const { tagSlugs, ...data } = parsed.data;
    const baseSlug = slugify(`${data.name}-${data.city}`);
    const existingSlug = await prisma.shop.findUnique({ where: { slug: baseSlug } });
    const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const tags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugs } },
    });

    const shop = await prisma.shop.create({
      data: {
        ...data,
        slug,
        tags: {
          connect: tags.map((t) => ({ id: t.id })),
        },
      },
      include: { tags: true },
    });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/shops error:', error);
    return NextResponse.json({ error: 'Failed to create coffee shop' }, { status: 500 });
  }
}

export type AdminShop = Prisma.ShopGetPayload<{
  include: {
    tags: true;
    loyaltyProgram: true;
    _count: { select: { reviews: true; favorites: true } };
  };
}>;
