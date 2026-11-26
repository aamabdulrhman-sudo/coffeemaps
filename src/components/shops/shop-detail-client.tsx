'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Star,
} from 'lucide-react';
import { useShopDetail, useToggleFavorite } from '@/hooks/use-coffeemap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareShopButton } from '@/components/shops/share-shop-button';
import { AiSummaryCard } from '@/components/shops/ai-summary-card';
import { ReviewForm } from '@/components/reviews/review-form';
import { ReviewList } from '@/components/reviews/review-list';
import { MapWrapper } from '@/components/map/map-wrapper';
import { ErrorState } from '@/components/states/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRating } from '@/lib/utils';

export function ShopDetailClient({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const { data, isLoading, isError, refetch } = useShopDetail(slug);
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !data?.shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState
          title="Coffee shop not found"
          message="This coffee shop may have been removed or the URL is incorrect."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const shop = data.shop;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to map
        </Link>

        <div className="flex items-center gap-2">
          <ShareShopButton slug={shop.slug} name={shop.name} />
          <Button
            variant={shop.isFavorited ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFavorite.mutate(shop.id)}
          >
            <Heart className={cn('h-4 w-4', shop.isFavorited && 'fill-current')} />
            {shop.isFavorited ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Hero Photo & Header */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="relative h-72 w-full sm:h-96">
          <img src={shop.imageUrl} alt={shop.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-2 flex flex-wrap gap-2">
              {shop.tags.map((tag) => (
                <Badge key={tag.id} className="bg-white/20 text-white backdrop-blur-md">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{shop.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {formatRating(shop.averageRating)} ({shop.reviewCount} reviews)
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {shop.address}, {shop.city}, {shop.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3 rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">About this coffee shop</h2>
            <p className="leading-relaxed text-muted-foreground">{shop.description}</p>
          </section>

          <AiSummaryCard shopId={shop.id} initialSummary={shop.aiSummary} />

          {/* Community Gallery */}
          {shop.photos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Community Photos</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {shop.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.caption ?? shop.name}
                    className="aspect-square w-full rounded-xl border object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Reviews ({shop.reviews.length})
              </h2>
            </div>

            {session?.user ? (
              <ReviewForm shopId={shop.id} onSuccess={() => refetch()} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/40 p-5">
                <p className="text-sm text-muted-foreground">
                  Sign in to rate this shop, upload photos, and share your review.
                </p>
                <Button size="sm" asChild>
                  <Link href="/auth/signin">Sign in to review</Link>
                </Button>
              </div>
            )}

            <ReviewList
              reviews={shop.reviews}
              shopId={shop.id}
              currentUserId={session?.user?.id}
              onChanged={() => refetch()}
            />
          </section>
        </div>

        {/* Right Sidebar Info & Mini Map */}
        <aside className="space-y-5">
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <h3 className="text-base font-semibold">Visit Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Opening Hours</p>
                  <p className="text-muted-foreground">{shop.openingHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">
                    {shop.address}, {shop.city}
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full" asChild>
              <a href={shop.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="h-72 overflow-hidden rounded-2xl border">
            <MapWrapper shops={[shop]} selectedShopId={shop.id} />
          </div>
        </aside>
      </div>
    </main>
  );
}
