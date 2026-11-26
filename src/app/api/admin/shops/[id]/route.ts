import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adminShopUpdateSchema } from '@/lib/validations';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminShopUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid shop data' },
        { status: 400 }
      );
    }

    const { tagSlugs, ...data } = parsed.data;

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        ...data,
        ...(tagSlugs
          ? {
              tags: {
                set: [],
                connect: (await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } })).map(
                  (t) => ({ id: t.id })
                ),
              },
            }
          : {}),
      },
      include: { tags: true },
    });

    return NextResponse.json({ shop });
  } catch (error) {
    console.error('PATCH /api/admin/shops/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update coffee shop' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { id } = await context.params;
    await prisma.shop.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/shops/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete coffee shop' }, { status: 500 });
  }
}
