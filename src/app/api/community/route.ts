import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const session = await auth();

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        city: true,
        createdAt: true,
        _count: {
          select: { reviews: true, followers: true, following: true, photos: true },
        },
      },
      orderBy: { reviews: { _count: 'desc' } },
      take: 60,
    });

    let followingIds = new Set<string>();
    if (session?.user?.id) {
      const follows = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });
      followingIds = new Set(follows.map((f) => f.followingId));
    }

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        isFollowing: followingIds.has(u.id),
        isSelf: session?.user?.id === u.id,
      })),
    });
  } catch (error) {
    console.error('GET /api/community error:', error);
    return NextResponse.json({ error: 'Failed to load community members' }, { status: 500 });
  }
}
