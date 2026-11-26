import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adBannerCreateSchema } from '@/lib/validations';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const banners = await prisma.adBanner.findMany({
      include: { shop: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('GET /api/admin/banners error:', error);
    return NextResponse.json({ error: 'Failed to load banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const parsed = adBannerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid banner data' },
        { status: 400 }
      );
    }

    const { shopId, linkUrl, ...data } = parsed.data;

    const banner = await prisma.adBanner.create({
      data: {
        ...data,
        linkUrl: linkUrl || null,
        shopId: shopId || null,
      },
      include: { shop: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/banners error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
