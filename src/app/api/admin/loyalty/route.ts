import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { loyaltyProgramSchema } from '@/lib/validations';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const programs = await prisma.loyaltyProgram.findMany({
      include: {
        shop: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { balances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ programs });
  } catch (error) {
    console.error('GET /api/admin/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to load loyalty programs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const parsed = loyaltyProgramSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid loyalty program data' },
        { status: 400 }
      );
    }

    const { shopId, ...data } = parsed.data;

    const program = await prisma.loyaltyProgram.upsert({
      where: { shopId },
      create: { shopId, ...data },
      update: data,
      include: {
        shop: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { balances: true } },
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to save loyalty program' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    await prisma.loyaltyProgram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/admin/loyalty error:', error);
    return NextResponse.json({ error: 'Failed to delete loyalty program' }, { status: 500 });
  }
}
