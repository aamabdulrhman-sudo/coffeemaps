import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loyaltyCheckInSchema } from '@/lib/validations';
import { ensureBalance, ensureLoyaltyCard } from '@/lib/loyalty';

/**
 * Self check-in at a coffee shop with an active loyalty program → one stamp
 * on the customer's universal card balance for THAT shop (other cafes unaffected).
 * One self check-in per shop per day.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = loyaltyCheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid check-in data' },
        { status: 400 }
      );
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { shopId: parsed.data.shopId },
      include: { shop: { select: { id: true, name: true, slug: true } } },
    });

    if (!program || !program.active) {
      return NextResponse.json(
        { error: 'No active loyalty program at this coffee shop' },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const card = await ensureLoyaltyCard(userId);
    const balance = await ensureBalance(card.id, program.id);

    const now = new Date();
    const lastStamp = balance.lastStampedAt;
    const sameDay =
      lastStamp &&
      lastStamp.getFullYear() === now.getFullYear() &&
      lastStamp.getMonth() === now.getMonth() &&
      lastStamp.getDate() === now.getDate();

    if (balance.completedAt) {
      return NextResponse.json({
        balance,
        program,
        alreadyCompleted: true,
        message: 'Reward already unlocked for this cafe',
      });
    }

    if (sameDay) {
      return NextResponse.json({
        balance,
        program,
        alreadyCheckedInToday: true,
        message: 'You already checked in today — come back tomorrow for another stamp',
      });
    }

    const newStamps = Math.min(balance.stamps + 1, program.stampsGoal);
    const completed = newStamps >= program.stampsGoal;

    const updatedBalance = await prisma.loyaltyBalance.update({
      where: { id: balance.id },
      data: {
        stamps: newStamps,
        completedAt: completed ? new Date() : null,
        lastStampedAt: now,
      },
    });

    return NextResponse.json({
      balance: updatedBalance,
      program,
      stamped: true,
      completed,
    });
  } catch (error) {
    console.error('POST /api/loyalty/checkin error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
