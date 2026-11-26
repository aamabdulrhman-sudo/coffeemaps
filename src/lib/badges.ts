import { prisma } from '@/lib/prisma';

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: {
    reviewCount: number;
    favoriteCount: number;
    photoCount: number;
    citiesVisited: number;
  }) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: 'FIRST_SIP',
    name: 'First Sip',
    description: 'Published your first coffee shop review.',
    icon: 'coffee',
    check: ({ reviewCount }) => reviewCount >= 1,
  },
  {
    code: 'CRITIC',
    name: 'Coffee Critic',
    description: 'Shared 5 or more thoughtful coffee reviews.',
    icon: 'star',
    check: ({ reviewCount }) => reviewCount >= 5,
  },
  {
    code: 'CONNOISSEUR',
    name: 'Espresso Connoisseur',
    description: 'Reviewed 10 or more specialty coffee spots.',
    icon: 'award',
    check: ({ reviewCount }) => reviewCount >= 10,
  },
  {
    code: 'CURATOR',
    name: 'Cafe Curator',
    description: 'Saved 3 or more favorite coffee shops.',
    icon: 'heart',
    check: ({ favoriteCount }) => favoriteCount >= 3,
  },
  {
    code: 'PHOTOGRAPHER',
    name: 'Latte Artist',
    description: 'Uploaded 3 or more coffee shop photos.',
    icon: 'camera',
    check: ({ photoCount }) => photoCount >= 3,
  },
  {
    code: 'EXPLORER',
    name: 'City Explorer',
    description: 'Reviewed or saved coffee shops in 2 or more cities.',
    icon: 'compass',
    check: ({ citiesVisited }) => citiesVisited >= 2,
  },
];

export function evaluateEligibleBadges(stats: {
  reviewCount: number;
  favoriteCount: number;
  photoCount: number;
  citiesVisited: number;
}): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.check(stats));
}

export async function syncUserBadges(userId: string) {
  const [reviews, favorites, photoCount] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      select: { shop: { select: { city: true } } },
    }),
    prisma.favorite.findMany({
      where: { userId },
      select: { shop: { select: { city: true } } },
    }),
    prisma.photo.count({ where: { userId } }),
  ]);

  const citySet = new Set<string>();
  for (const r of reviews) citySet.add(r.shop.city);
  for (const f of favorites) citySet.add(f.shop.city);

  const eligible = evaluateEligibleBadges({
    reviewCount: reviews.length,
    favoriteCount: favorites.length,
    photoCount,
    citiesVisited: citySet.size,
  });

  await Promise.all(
    eligible.map((badge) =>
      prisma.userBadge.upsert({
        where: { userId_code: { userId, code: badge.code } },
        update: {},
        create: {
          userId,
          code: badge.code,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        },
      })
    )
  );

  return prisma.userBadge.findMany({
    where: { userId },
    orderBy: { awardedAt: 'asc' },
  });
}
