import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewCreateSchema } from '@/lib/validations';
import { recalculateShopStats } from '@/lib/shop-stats';
import { syncUserBadges } from '@/lib/badges';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const userId = searchParams.get('userId');

    const reviews = await prisma.review.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            badges: true,
          },
        },
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to post a review' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid review payload' },
        { status: 400 }
      );
    }

    const { shopId, rating, title, comment, photoUrls } = parsed.data;

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: 'Coffee shop not found' }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        title: title ?? null,
        comment,
        userId: session.user.id,
        shopId,
        photos:
          photoUrls.length > 0
            ? {
                create: photoUrls.map((url) => ({
                  url,
                  userId: session.user.id,
                  shopId,
                })),
              }
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            badges: true,
          },
        },
        photos: true,
      },
    });

    await Promise.all([
      recalculateShopStats(shopId, true),
      syncUserBadges(session.user.id),
    ]);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
