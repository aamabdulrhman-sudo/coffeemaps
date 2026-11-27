import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeCardCode } from '@/lib/loyalty';

/**
 * Cafe console: look up a customer loyalty card by its code.
 * Accessible to the shop's staff account (role=SHOP bound to that shop) or platform admins.
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, shopId: true },
    });

    if (!staff || (staff.role !== 'SHOP' && staff.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Cafe staff access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('code');
    if (!raw) {
      return NextResponse.json({ error: 'Card code is required' }, { status: 400 });
    }
    const code = normalizeCardCode(raw);

    const card = await prisma.loyaltyCard.findUnique({
      where: { code },
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
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (staff.role === 'SHOP' && staff.shopId !== card.program.shopId) {
      return NextResponse.json({ error: 'This card belongs to another cafe' }, { status: 403 });
    }

    return NextResponse.json({
      card: {
        id: card.id,
        code: card.code,
        stamps: card.stamps,
        redemptions: card.redemptions,
        completedAt: card.completedAt,
        lastRedeemedAt: card.lastRedeemedAt,
        updatedAt: card.updatedAt,
        program: card.program,
        user: card.user,
      },
    });
  } catch (error) {
    console.error('GET /api/cafe/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to look up card' }, { status: 500 });
  }
}
