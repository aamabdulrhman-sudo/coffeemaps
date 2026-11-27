'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Award,
  Camera,
  Compass,
  Gift,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { useDashboard, useToggleFavorite } from '@/hooks/use-coffeemap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgePill } from '@/components/badges/badge-pill';
import { ShopCard } from '@/components/shops/shop-card';
import { DashboardSkeleton } from '@/components/states/loading-skeletons';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { data, isLoading, isError, refetch } = useDashboard();
  const toggleFavorite = useToggleFavorite();
  const { t, formatDate } = useI18n();

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
          title={t.dashSignInTitle}
          description={t.dashSignInDesc}
        />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/auth/signin">{t.signIn}</Link>
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
    { label: t.dashSavedShops, value: data.stats.savedCount, icon: Heart },
    { label: t.dashReviewsWritten, value: data.stats.reviewCount, icon: MessageSquare },
    {
      label: t.dashAvgRating,
      value: data.stats.averageRatingGiven > 0 ? `${data.stats.averageRatingGiven} ★` : '—',
      icon: Star,
    },
    { label: t.dashCitiesExplored, value: data.stats.citiesVisited, icon: Compass },
  ];

  const maxDistCount = Math.max(...data.ratingDistribution.map((d) => d.count), 1);
  const wallet = data.loyaltyWallet;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t.dashWelcome}, {session.user.name?.split(' ')[0] ?? t.dashExplorer}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.dashSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/community">
              <Users className="h-4 w-4" />
              {t.navCommunity}
              <span className="text-xs text-muted-foreground">
                {data.stats.followers} / {data.stats.following}
              </span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">{t.dashEditProfile}</Link>
          </Button>
        </div>
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
              {t.dashPersonalStats}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t.dashPhotosShared}</span>
              <span className="font-semibold">{data.stats.photoCount}</span>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.dashRatingDist}
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
              {t.dashBadges} ({data.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.badges.length === 0 ? (
              <EmptyState icon={Award} title={t.dashNoBadges} description={t.dashNoBadgesDesc} />
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

      {/* Loyalty Cards */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Gift className="h-5 w-5 text-primary" />
              {t.dashLoyalty}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t.dashLoyaltyDesc}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/loyalty">
              <Ticket className="h-4 w-4" />
              {t.dashOpenWallet}
            </Link>
          </Button>
        </div>
        {!wallet || wallet.card.balances.length === 0 ? (
          <EmptyState icon={Gift} title={t.dashLoyaltyEmpty} description={t.dashLoyaltyEmptyDesc} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallet.card.balances.map((balance) => {
              const goal = balance.program.stampsGoal;
              const progress = Math.min(balance.stamps, goal);
              const rewardReady = balance.stamps >= goal;
              return (
                <Card
                  key={balance.id}
                  className={cn(rewardReady && 'border-primary/50 bg-primary/5')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-sm font-semibold">
                      {balance.program.shop.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: goal }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border text-[10px]',
                            i < progress
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-dashed border-muted-foreground/40 text-muted-foreground'
                          )}
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {balance.stamps}/{goal}
                      </span>{' '}
                      {t.dashStamps}
                    </p>
                    {balance.program.reward && (
                      <p className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs">
                        <span className="font-semibold">{t.dashReward}: </span>
                        {balance.program.reward}
                      </p>
                    )}
                    {rewardReady && (
                      <p className="text-xs font-semibold text-primary">🎁 {t.dashCompleted}</p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/shops/${balance.program.shop.slug}`}>{t.loyaltyCheckIn}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Reviews — My Experiences */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t.dashMyExperiences}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t.dashMyExperiencesDesc}</p>
        </div>
        {data.recentReviews.length === 0 ? (
          <EmptyState title={t.dashNoReviews} description={t.dashNoReviewsDesc} />
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
                <p className="text-xs text-muted-foreground">
                  {review.shop.city} • {formatDate(review.createdAt)}
                </p>
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
            <h2 className="text-xl font-semibold">{t.dashSavedCafes}</h2>
            <Link href="/favorites" className="text-sm font-medium text-primary hover:underline">
              {t.viewAll} →
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
