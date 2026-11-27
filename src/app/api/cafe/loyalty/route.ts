import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureBalance, normalizeCardCode } from '@/lib/loyalty';

/**
 * Cafe console: scan/enter the customer's UNIVERSAL card code → identify the customer,
 * then show ONLY this cafe's stamp balance for that customer. Other cafes' balances
 * are never exposed. Accessible to the cafe's staff account (role=SHOP) or admins.
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
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Resolve this cafe's loyalty program
    const shopId =
      staff.role === 'SHOP' ? staff.shopId : (searchParams.get('shopId') ?? staff.shopId);
    if (!shopId) {
      return NextResponse.json({ error: 'This cafe is not linked to a shop' }, { status: 400 });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { shopId },
      include: { shop: { select: { id: true, name: true, slug: true, city: true } } },
    });

    if (!program || !program.active) {
      return NextResponse.json(
        { error: 'Your cafe has no active loyalty program yet' },
        { status: 404 }
      );
    }

    // Per-cafe balance only — zero if this customer never visited this cafe
    const balance = await ensureBalance(card.id, program.id);

    return NextResponse.json({
      card: {
        id: card.id,
        code: card.code,
        user: card.user,
      },
      program,
      balance: {
        id: balance.id,
        stamps: balance.stamps,
        redemptions: balance.redemptions,
        completedAt: balance.completedAt,
        lastRedeemedAt: balance.lastRedeemedAt,
        lastStampedAt: balance.lastStampedAt,
        updatedAt: balance.updatedAt,
      },
    });
  } catch (error) {
    console.error('GET /api/cafe/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to look up card' }, { status: 500 });
  }
}
