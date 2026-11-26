import { prisma } from '@/lib/prisma';
import { generateReviewSummary } from '@/lib/ai-summary';

/**
 * Recomputes a shop's aggregate rating, review count, favorite count, trending score, and AI summary.
 */
export async function recalculateShopStats(shopId: string, refreshSummary = true) {
  const [shop, reviews, favoriteCount] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true } }),
    prisma.review.findMany({
      where: { shopId },
      select: { rating: true, title: true, comment: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.favorite.count({ where: { shopId } }),
  ]);

  if (!shop) return null;

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(2))
      : 0;

  // Trending score weighs rating quality, review volume, and favorites
  const trendingScore = Number(
    (averageRating * 14 + Math.min(reviewCount, 20) * 1.5 + Math.min(favoriteCount, 20) * 1.2).toFixed(
      2
    )
  );

  const aiSummary = refreshSummary ? await generateReviewSummary(shop.name, reviews) : undefined;

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      averageRating,
      reviewCount,
      favoriteCount,
      trendingScore,
      ...(aiSummary !== undefined
        ? { aiSummary, aiSummaryUpdatedAt: new Date() }
        : {}),
    },
  });
}
