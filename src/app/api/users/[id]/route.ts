import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { email: id }] },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        city: true,
        createdAt: true,
        badges: true,
        reviews: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                imageUrl: true,
                averageRating: true,
              },
            },
            photos: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { reviews: true, followers: true, following: true, photos: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let isFollowing = false;
    if (session?.user?.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = Boolean(follow);
    }

    return NextResponse.json({ user: { ...user, isFollowing } });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
