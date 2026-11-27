import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureLoyaltyCard } from '@/lib/loyalty';

/**
 * The signed-in customer's ONE universal loyalty wallet card
 * with per-cafe stamp balances (QR identifies the customer at any cafe).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const [user, card] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, image: true },
      }),
      prisma.loyaltyCard.findUnique({
        where: { userId },
        include: {
          balances: {
            include: {
              program: {
                include: {
                  shop: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      imageUrl: true,
                      city: true,
                    },
                  },
                },
              },
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      }),
    ]);

    // Every customer gets a universal card — create it on first wallet open
    const finalCard = card ?? (await ensureLoyaltyCard(userId));
    const balances = await prisma.loyaltyBalance.findMany({
      where: { cardId: finalCard.id },
      include: {
        program: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      user,
      card: {
        id: finalCard.id,
        code: finalCard.code,
        createdAt: finalCard.createdAt,
        balances,
      },
    });
  } catch (error) {
    console.error('GET /api/loyalty/my error:', error);
    return NextResponse.json({ error: 'Failed to load loyalty wallet' }, { status: 500 });
  }
}
