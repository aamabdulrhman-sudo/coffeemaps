import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { favoriteToggleSchema } from '@/lib/validations';
import { recalculateShopStats } from '@/lib/shop-stats';
import { syncUserBadges } from '@/lib/badges';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        shop: {
          include: { tags: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        ...f.shop,
        isFavorited: true,
      })),
    });
  } catch (error) {
    console.error('GET /api/favorites error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to save favorites' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = favoriteToggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid shop ID' }, { status: 400 });
    }

    const { shopId } = parsed.data;
    const key = {
      userId_shopId: {
        userId: session.user.id,
        shopId,
      },
    };

    const existing = await prisma.favorite.findUnique({ where: key });

    let isFavorited = false;
    if (existing) {
      await prisma.favorite.delete({ where: key });
      isFavorited = false;
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          shopId,
        },
      });
      isFavorited = true;
    }

    await Promise.all([
      recalculateShopStats(shopId, false),
      syncUserBadges(session.user.id),
    ]);

    return NextResponse.json({ isFavorited, shopId });
  } catch (error) {
    console.error('POST /api/favorites error:', error);
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 });
  }
}
