import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ShopDetailClient } from '@/components/shops/shop-detail-client';
import { getBaseUrl } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      name: true,
      description: true,
      city: true,
      imageUrl: true,
      slug: true,
    },
  });

  if (!shop) {
    return {
      title: 'Coffee Shop Not Found',
    };
  }

  return {
    title: `${shop.name} (${shop.city})`,
    description: shop.description.slice(0, 155),
    openGraph: {
      title: `${shop.name} — CoffeeMap`,
      description: shop.description.slice(0, 155),
      url: `${getBaseUrl()}/shops/${shop.slug}`,
      images: [{ url: shop.imageUrl, width: 1200, height: 630, alt: shop.name }],
    },
  };
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ShopDetailClient slug={slug} />;
}
