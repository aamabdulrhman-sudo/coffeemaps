import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/favorites`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/dashboard`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  try {
    const shops = await prisma.shop.findMany({
      select: { slug: true, updatedAt: true },
    });

    const shopRoutes: MetadataRoute.Sitemap = shops.map((shop) => ({
      url: `${baseUrl}/shops/${shop.slug}`,
      lastModified: shop.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    return [...staticRoutes, ...shopRoutes];
  } catch {
    return staticRoutes;
  }
}
