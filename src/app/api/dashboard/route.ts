import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncUserBadges } from '@/lib/badges';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    const [favorites, reviews, photoCount, badges, loyaltyCards, followCounts] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: { shop: { include: { tags: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.findMany({
        where: { userId },
        include: {
          shop: {
            select: { id: true, name: true, slug: true, city: true, imageUrl: true },
          },
          user: {
            select: { id: true, name: true, image: true },
          },
          photos: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.photo.count({ where: { userId } }),
      syncUserBadges(userId),
      prisma.loyaltyCard.findMany({
        where: { userId },
        include: {
          program: {
            include: {
              shop: { select: { id: true, name: true, slug: true, imageUrl: true, city: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: { select: { followers: true, following: true } },
        },
      }),
    ]);

    const citySet = new Set<string>();
    favorites.forEach((f) => citySet.add(f.shop.city));
    reviews.forEach((r) => citySet.add(r.shop.city));

    const averageRatingGiven =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
        : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    return NextResponse.json({
      stats: {
        savedCount: favorites.length,
        reviewCount: reviews.length,
        photoCount,
        averageRatingGiven,
        citiesVisited: citySet.size,
        followers: followCounts?._count.followers ?? 0,
        following: followCounts?._count.following ?? 0,
      },
      badges,
      recentReviews: reviews.slice(0, 6),
      favorites: favorites.slice(0, 6).map((f) => ({ ...f.shop, isFavorited: true })),
      ratingDistribution,
      loyaltyCards,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
