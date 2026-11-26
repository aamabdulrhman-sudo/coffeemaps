import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reviewUpdateSchema } from '@/lib/validations';
import { recalculateShopStats } from '@/lib/shop-stats';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reviewUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid update data' },
        { status: 400 }
      );
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.comment !== undefined ? { comment: parsed.data.comment } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, badges: true },
        },
        photos: true,
      },
    });

    await recalculateShopStats(existing.shopId, true);

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('PATCH /api/reviews/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.review.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });
    await recalculateShopStats(existing.shopId, true);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('DELETE /api/reviews/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
