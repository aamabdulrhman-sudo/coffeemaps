import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.adBanner.findMany({
      where: { active: true },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            imageUrl: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 8,
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('GET /api/ads error:', error);
    return NextResponse.json({ error: 'Failed to load ad banners' }, { status: 500 });
  }
}
