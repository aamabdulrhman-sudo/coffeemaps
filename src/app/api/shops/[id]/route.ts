import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        tags: true,
        loyaltyProgram: true,
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
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
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Coffee shop not found' }, { status: 404 });
    }

    let isFavorited = false;
    if (session?.user?.id) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_shopId: {
            userId: session.user.id,
            shopId: shop.id,
          },
        },
      });
      isFavorited = Boolean(fav);
    }

    let loyaltyBalance = null;
    if (shop.loyaltyProgram && session?.user?.id) {
      const card = await prisma.loyaltyCard.findUnique({
        where: { userId: session.user.id },
      });
      if (card) {
        loyaltyBalance = await prisma.loyaltyBalance.findUnique({
          where: { cardId_programId: { cardId: card.id, programId: shop.loyaltyProgram.id } },
        });
      }
    }

    return NextResponse.json({
      shop: {
        ...shop,
        isFavorited,
        loyaltyBalance,
      },
    });
  } catch (error) {
    console.error('GET /api/shops/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch coffee shop' }, { status: 500 });
  }
}
