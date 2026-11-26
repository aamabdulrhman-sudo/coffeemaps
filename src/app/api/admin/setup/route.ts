import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { adminSetupSchema } from '@/lib/validations';

/**
 * One-time (or token-gated) platform admin bootstrap.
 * Requires ADMIN_SETUP_TOKEN env var to match, and target account must not already be ADMIN.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminSetupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid setup data' },
        { status: 400 }
      );
    }

    const expectedToken = process.env.ADMIN_SETUP_TOKEN;
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Admin setup is disabled. Set ADMIN_SETUP_TOKEN env var to enable it.' },
        { status: 403 }
      );
    }

    if (parsed.data.setupToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing) {
      if (existing.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'This account is already a platform admin' },
          { status: 409 }
        );
      }
      user = await prisma.user.update({
        where: { email },
        data: { name, passwordHash, role: 'ADMIN' },
        select: { id: true, name: true, email: true, role: true },
      });
    } else {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      user = await prisma.user.create({
        data: { name, email, passwordHash, role: 'ADMIN' },
        select: { id: true, name: true, email: true, role: true },
      });
      if (adminCount > 0) {
        // creating new admin accounts beyond the first still requires valid token (checked above)
      }
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/setup error:', error);
    return NextResponse.json({ error: 'Failed to set up platform admin' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    return NextResponse.json({
      setupEnabled: Boolean(process.env.ADMIN_SETUP_TOKEN),
      adminCount,
    });
  } catch (error) {
    console.error('GET /api/admin/setup error:', error);
    return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 });
  }
}
