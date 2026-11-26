import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { adminRoleUpdateSchema } from '@/lib/validations';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        image: true,
        createdAt: true,
        _count: { select: { reviews: true, followers: true, following: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const parsed = adminRoleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid role data' },
        { status: 400 }
      );
    }

    const targetId = (body as { userId?: string }).userId;
    if (!targetId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (targetId === guard.session!.user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
      select: { id: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('PATCH /api/admin/users error:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}
