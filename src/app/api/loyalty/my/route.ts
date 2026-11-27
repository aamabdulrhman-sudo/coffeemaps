import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** The signed-in customer's loyalty wallet cards (with QR codes shown on /loyalty). */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const cards = await prisma.loyaltyCard.findMany({
      where: { userId: session.user.id },
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

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('GET /api/loyalty/my error:', error);
    return NextResponse.json({ error: 'Failed to load loyalty cards' }, { status: 500 });
  }
}
