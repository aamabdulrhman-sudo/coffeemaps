import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Public click-tracking endpoint for ad banners (fire-and-forget from client). */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const banner = await prisma.adBanner.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { id: true, clicks: true },
    });
    return NextResponse.json({ banner });
  } catch (error) {
    console.error('POST /api/ads/[id]/click error:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
