import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveCityFromCoords } from '@/lib/geocoding';
import { haversineDistanceKm, slugify } from '@/lib/utils';
import { shopCreateSchema, shopFilterSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = shopFilterSchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      city: searchParams.get('city') ?? undefined,
      priorityCity: searchParams.get('priorityCity') ?? undefined,
      minRating: searchParams.get('minRating') ?? undefined,
      tags: searchParams.get('tags') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      lat: searchParams.get('lat') ?? undefined,
      lng: searchParams.get('lng') ?? undefined,
      radiusKm: searchParams.get('radiusKm') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { q, city, priorityCity, minRating, tags, sort, lat, lng, radiusKm } = parsed.data;
    const session = await auth();

    const where: Prisma.ShopWhereInput = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (city && city !== 'all') {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (minRating && minRating > 0) {
      where.averageRating = { gte: minRating };
    }

    if (tags) {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        where.AND = tagList.map((slug) => ({
          tags: { some: { slug } },
        }));
      }
    }

    const [shops, userFavorites, allCities, allTags, allCoords] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          tags: true,
        },
        orderBy:
          sort === 'rating'
            ? { averageRating: 'desc' }
            : sort === 'reviews'
              ? { reviewCount: 'desc' }
              : { trendingScore: 'desc' },
      }),
      session?.user?.id
        ? prisma.favorite.findMany({
            where: { userId: session.user.id },
            select: { shopId: true },
          })
        : Promise.resolve([]),
      prisma.shop.findMany({
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      }),
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      lat !== undefined && lng !== undefined
        ? prisma.shop.findMany({
            select: { city: true, latitude: true, longitude: true },
          })
        : Promise.resolve([]),
    ]);

    const favSet = new Set(userFavorites.map((f) => f.shopId));
    const hasLocation = lat !== undefined && lng !== undefined;

    const detectedCity =
      hasLocation && (!priorityCity || priorityCity === 'all')
        ? await resolveCityFromCoords(lat, lng, allCoords)
        : null;

    const activePriorityCity =
      priorityCity && priorityCity !== 'all'
        ? priorityCity
        : city && city !== 'all'
          ? city
          : detectedCity;

    const normalizedPriority = activePriorityCity?.toLowerCase() ?? null;

    let enriched = shops.map((shop) => {
      const distanceKm = hasLocation
        ? haversineDistanceKm(lat, lng, shop.latitude, shop.longitude)
        : null;
      const isPriorityCity = Boolean(
        normalizedPriority && shop.city.toLowerCase() === normalizedPriority
      );
      return {
        ...shop,
        isFavorited: favSet.has(shop.id),
        isPriorityCity,
        distanceKm,
      };
    });

    if (hasLocation && radiusKm !== undefined) {
      enriched = enriched.filter((shop) => shop.distanceKm !== null && shop.distanceKm <= radiusKm);
    }

    if (hasLocation && sort === 'nearest') {
      enriched.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    // Always place priority city shops first while preserving inner sort order
    if (normalizedPriority) {
      enriched.sort((a, b) => {
        if (a.isPriorityCity === b.isPriorityCity) return 0;
        return a.isPriorityCity ? -1 : 1;
      });
    }

    return NextResponse.json({
      shops: enriched,
      cities: allCities.map((c) => c.city),
      tags: allTags,
      detectedCity,
      activePriorityCity: activePriorityCity ?? null,
    });
  } catch (error) {
    console.error('GET /api/shops error:', error);
    return NextResponse.json({ error: 'Failed to load coffee shops' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only platform admins can add coffee shops
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only platform admins can add coffee shops' },
        { status: 403 }
      );
    }

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
    console.error('POST /api/shops error:', error);
    return NextResponse.json({ error: 'Failed to create coffee shop' }, { status: 500 });
  }
}
