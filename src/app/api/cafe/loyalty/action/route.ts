import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeCardCode } from '@/lib/loyalty';

const cafeStampActionSchema = z.object({
  code: z.string().min(4, 'Card code is required'),
  action: z.enum(['add', 'redeem']),
  // 'add': one stamp per purchase (cafe may add several at once, e.g. 2 drinks)
  amount: z.coerce.number().int().min(1).max(10).optional().default(1),
});

/**
 * Cafe console: add stamps for a purchase, or redeem the unlocked reward
 * (deducts the full stamps goal from the card).
 * Accessible to the shop's staff account (role=SHOP bound to that shop) or platform admins.
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = cafeStampActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid action data' },
        { status: 400 }
      );
    }

    const code = normalizeCardCode(parsed.data.code);

    const card = await prisma.loyaltyCard.findUnique({
      where: { code },
      include: {
        program: {
          include: {
            shop: { select: { id: true, name: true, slug: true } },
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (staff.role === 'SHOP' && staff.shopId !== card.program.shopId) {
      return NextResponse.json({ error: 'This card belongs to another cafe' }, { status: 403 });
    }

    const goal = card.program.stampsGoal;

    if (parsed.data.action === 'add') {
      const newStamps = Math.min(card.stamps + parsed.data.amount, goal * 2);
      const updated = await prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stamps: newStamps,
          completedAt: newStamps >= goal ? (card.completedAt ?? new Date()) : null,
        },
      });
      return NextResponse.json({
        action: 'add',
        card: updated,
        rewardReady: newStamps >= goal,
        message:
          newStamps >= goal
            ? `Reward unlocked for ${card.user.name ?? 'customer'}`
            : `+${parsed.data.amount} stamp(s) added`,
      });
    }

    // action === 'redeem'
    if (card.stamps < goal) {
      return NextResponse.json(
        { error: `Not enough stamps: ${card.stamps}/${goal}` },
        { status: 400 }
      );
    }

    const updated = await prisma.loyaltyCard.update({
      where: { id: card.id },
      data: {
        stamps: card.stamps - goal,
        redemptions: { increment: 1 },
        lastRedeemedAt: new Date(),
        completedAt: null,
      },
    });

    return NextResponse.json({
      action: 'redeem',
      card: updated,
      message: `Reward redeemed for ${card.user.name ?? 'customer'} (${card.program.reward})`,
    });
  } catch (error) {
    console.error('POST /api/cafe/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to process stamp action' }, { status: 500 });
  }
}
