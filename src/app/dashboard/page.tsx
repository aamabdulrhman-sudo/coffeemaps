'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Award, Camera, Compass, Heart, LayoutDashboard, MessageSquare, Star } from 'lucide-react';
import { useDashboard, useToggleFavorite } from '@/hooks/use-coffeemap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgePill } from '@/components/badges/badge-pill';
import { ShopCard } from '@/components/shops/shop-card';
import { DashboardSkeleton } from '@/components/states/loading-skeletons';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { data, isLoading, isError, refetch } = useDashboard();
  const toggleFavorite = useToggleFavorite();

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <DashboardSkeleton />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={LayoutDashboard}
          title="Sign in to open your CoffeeMap Dashboard"
          description="Track your saved cafes, review statistics, and earned CoffeeMap explorer badges."
        />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <DashboardSkeleton />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState onRetry={() => refetch()} />
      </main>
    );
  }

  const statCards = [
    { label: 'Saved Shops', value: data.stats.savedCount, icon: Heart },
    { label: 'Reviews Written', value: data.stats.reviewCount, icon: MessageSquare },
    {
      label: 'Avg Rating Given',
      value: data.stats.averageRatingGiven > 0 ? `${data.stats.averageRatingGiven} ★` : '—',
      icon: Star,
    },
    { label: 'Cities Explored', value: data.stats.citiesVisited, icon: Compass },
  ];

  const maxDistCount = Math.max(...data.ratingDistribution.map((d) => d.count), 1);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {session.user.name?.split(' ')[0] ?? 'Explorer'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personal coffee discovery metrics, badges, and activity.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/profile">Edit profile</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rating Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" />
              Personal Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Photos shared</span>
              <span className="font-semibold">{data.stats.photoCount}</span>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Rating Distribution
              </p>
              {data.ratingDistribution.map((row) => (
                <div key={row.rating} className="flex items-center gap-2 text-xs">
                  <span className="w-8 font-medium">{row.rating} ★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(row.count / maxDistCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badges Showcase */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" />
              Earned Badges ({data.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.badges.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No badges unlocked yet"
                description="Write your first review or save 3 coffee shops to start earning badges!"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.badges.map((badge) => (
                  <BadgePill
                    key={badge.id}
                    name={badge.name}
                    icon={badge.icon}
                    description={badge.description}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Reviews</h2>
        {data.recentReviews.length === 0 ? (
          <EmptyState
            title="You haven't reviewed a shop yet"
            description="Visit any coffee shop page to share your first rating and review."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.recentReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/shops/${review.shop.slug}`}
                    className="font-semibold hover:text-primary hover:underline"
                  >
                    {review.shop.name}
                  </Link>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {review.rating}/5
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{review.shop.city}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{review.comment}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Saved Cafes Preview */}
      {data.favorites.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Saved Cafes</h2>
            <Link href="/favorites" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.favorites.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onToggleFavorite={(shopId) => toggleFavorite.mutate(shopId)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
