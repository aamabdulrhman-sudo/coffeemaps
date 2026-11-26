import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      session: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return {
      error: NextResponse.json(
        { error: 'Only platform admins can perform this action' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session: { ...session, user: { ...session.user, ...user } } };
}

export function isAdminSession(role?: string | null): boolean {
  return role === 'ADMIN';
}
