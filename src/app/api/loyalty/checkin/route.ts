import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loyaltyCheckInSchema } from '@/lib/validations';

/**
 * Check in at a coffee shop with an active loyalty program → collect one stamp.
 * One check-in per shop per day. Completing the goal unlocks the reward.
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
    const card = await prisma.loyaltyCard.upsert({
      where: { userId_programId: { userId, programId: program.id } },
      create: { userId, programId: program.id, stamps: 0 },
      update: {},
    });

    const now = new Date();
    const lastCheckIn = card.updatedAt;
    const sameDay =
      lastCheckIn &&
      lastCheckIn.getFullYear() === now.getFullYear() &&
      lastCheckIn.getMonth() === now.getMonth() &&
      lastCheckIn.getDate() === now.getDate();

    if (card.completedAt) {
      return NextResponse.json({
        card,
        program,
        alreadyCompleted: true,
        message: 'Reward already unlocked for this card',
      });
    }

    if (sameDay) {
      return NextResponse.json({
        card,
        program,
        alreadyCheckedInToday: true,
        message: 'You already checked in today — come back tomorrow for another stamp',
      });
    }

    const newStamps = Math.min(card.stamps + 1, program.stampsGoal);
    const completed = newStamps >= program.stampsGoal;

    const updatedCard = await prisma.loyaltyCard.update({
      where: { id: card.id },
      data: {
        stamps: newStamps,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      card: updatedCard,
      program,
      stamped: true,
      completed,
    });
  } catch (error) {
    console.error('POST /api/loyalty/checkin error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
}
