import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adBannerUpdateSchema } from '@/lib/validations';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adBannerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid banner data' },
        { status: 400 }
      );
    }

    const { shopId, linkUrl, ...data } = parsed.data;

    const banner = await prisma.adBanner.update({
      where: { id },
      data: {
        ...data,
        ...(linkUrl !== undefined ? { linkUrl: linkUrl || null } : {}),
        ...(shopId !== undefined ? { shopId: shopId || null } : {}),
      },
      include: { shop: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('PATCH /api/admin/banners/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await context.params;
    await prisma.adBanner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/banners/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
