import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReviewSummary } from '@/lib/ai-summary';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const shop = await prisma.shop.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        reviews: {
          select: { rating: true, title: true, comment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Coffee shop not found' }, { status: 404 });
    }

    const aiSummary = await generateReviewSummary(shop.name, shop.reviews);

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        aiSummary,
        aiSummaryUpdatedAt: new Date(),
      },
      select: {
        id: true,
        aiSummary: true,
        aiSummaryUpdatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/shops/[id]/summary error:', error);
    return NextResponse.json({ error: 'Failed to generate review summary' }, { status: 500 });
  }
}
