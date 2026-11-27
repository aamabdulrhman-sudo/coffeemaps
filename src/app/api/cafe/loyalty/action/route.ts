import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureBalance, normalizeCardCode } from '@/lib/loyalty';

const cafeStampActionSchema = z.object({
  code: z.string().min(4, 'Card code is required'),
  action: z.enum(['add', 'redeem']),
  // 'add': stamps per purchase (cafe may add several at once, e.g. 2 drinks)
  amount: z.coerce.number().int().min(1).max(10).optional().default(1),
  // Admins may act on behalf of a specific cafe; SHOP accounts are bound to theirs
  shopId: z.string().optional().nullable(),
});

/**
 * Cafe console: add stamps for a purchase, or redeem the unlocked reward
 * (deducts the full stamps goal). Operates ONLY on this cafe's balance of the
 * customer's universal card — other cafes are never touched.
 * Accessible to the cafe's staff account (role=SHOP bound to that shop) or admins.
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

    if (staff.role === 'SHOP' && !staff.shopId) {
      return NextResponse.json({ error: 'This cafe is not linked to a shop' }, { status: 400 });
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
      include: { user: { select: { id: true, name: true } } },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Resolve this cafe's program — the only balance this cafe can touch
    const effectiveShopId = staff.role === 'SHOP' ? staff.shopId! : (parsed.data.shopId ?? null);
    if (!effectiveShopId) {
      return NextResponse.json({ error: 'Shop id is required for admin actions' }, { status: 400 });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { shopId: effectiveShopId },
      include: { shop: { select: { id: true, name: true, slug: true } } },
    });

    if (!program) {
      return NextResponse.json({ error: 'Your cafe has no loyalty program yet' }, { status: 404 });
    }

    const balance = await ensureBalance(card.id, program.id);
    const goal = program.stampsGoal;
    const customerName = card.user.name ?? 'customer';

    if (parsed.data.action === 'add') {
      const newStamps = Math.min(balance.stamps + parsed.data.amount, goal * 2);
      const updated = await prisma.loyaltyBalance.update({
        where: { id: balance.id },
        data: {
          stamps: newStamps,
          completedAt: newStamps >= goal ? (balance.completedAt ?? new Date()) : null,
          lastStampedAt: new Date(),
        },
      });
      return NextResponse.json({
        action: 'add',
        balance: updated,
        rewardReady: newStamps >= goal,
        message:
          newStamps >= goal
            ? `Reward unlocked for ${customerName}`
            : `+${parsed.data.amount} stamp(s) added for ${customerName}`,
      });
    }

    // action === 'redeem'
    if (balance.stamps < goal) {
      return NextResponse.json(
        { error: `Not enough stamps: ${balance.stamps}/${goal}` },
        { status: 400 }
      );
    }

    const updated = await prisma.loyaltyBalance.update({
      where: { id: balance.id },
      data: {
        stamps: balance.stamps - goal,
        redemptions: { increment: 1 },
        lastRedeemedAt: new Date(),
        completedAt: null,
      },
    });

    return NextResponse.json({
      action: 'redeem',
      balance: updated,
      message: `Reward redeemed for ${customerName} (${program.reward})`,
    });
  } catch (error) {
    console.error('POST /api/cafe/loyalty/action error:', error);
    return NextResponse.json({ error: 'Failed to process stamp action' }, { status: 500 });
  }
}
