'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@/hooks/use-coffeemap';
import { ShopCard } from '@/components/shops/shop-card';
import { ShopGridSkeleton } from '@/components/states/loading-skeletons';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const { data, isLoading, isError, refetch } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ShopGridSkeleton count={4} />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Heart}
          title="Sign in to view your favorite coffee shops"
          description="Save specialty cafes around the world and build your personal coffee map."
        />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const favorites = data?.favorites ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your Favorite Cafes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved spots ready for your next espresso run or study session.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Explore more on map</Link>
        </Button>
      </div>

      {isLoading ? (
        <ShopGridSkeleton count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved coffee shops yet"
          description="Tap the heart icon on any coffee shop to save it here for quick access."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onToggleFavorite={(shopId) => toggleFavorite.mutate(shopId)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
