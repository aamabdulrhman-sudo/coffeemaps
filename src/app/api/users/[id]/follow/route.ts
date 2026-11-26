import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Toggle follow/unfollow a community member. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await context.params;
    const followerId = session.user.id;

    if (followerId === id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: id } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      const count = await prisma.follow.count({ where: { followingId: id } });
      return NextResponse.json({ isFollowing: false, followersCount: count });
    }

    await prisma.follow.create({ data: { followerId, followingId: id } });
    const count = await prisma.follow.count({ where: { followingId: id } });
    return NextResponse.json({ isFollowing: true, followersCount: count });
  } catch (error) {
    console.error('POST /api/users/[id]/follow error:', error);
    return NextResponse.json({ error: 'Failed to update follow state' }, { status: 500 });
  }
}
