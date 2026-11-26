'use client';

import { use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Award,
  Camera,
  MapPin,
  MessageSquare,
  Star,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { usePublicProfile, useToggleFollow } from '@/hooks/use-coffeemap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgePill } from '@/components/badges/badge-pill';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/components/language-provider';
import { formatRating } from '@/lib/utils';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { t, formatDate } = useI18n();
  const { data, isLoading, isError, refetch } = usePublicProfile(id);
  const follow = useToggleFollow();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    );
  }

  if (isError || !data?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState onRetry={() => refetch()} />
      </main>
    );
  }

  const user = data.user;
  const isSelf = session?.user?.id === user.id;
  const isFollowing = user.isFollowing ?? false;

  const initials =
    user.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'CM';

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {user.name ?? t.profileCoffeeExplorer}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {user.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {user._count.reviews} {t.communityReviewsCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {user._count.followers} {t.profileFollowers} • {user._count.following}{' '}
                {t.profileFollowing}
              </span>
              <span className="inline-flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {user._count.photos}
              </span>
            </div>
            {user.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">{user.bio}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t.communityMemberSince} {formatDate(user.createdAt)}
            </p>
          </div>

          {!isSelf && session?.user && (
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              onClick={() => follow.mutate(user.id)}
              disabled={follow.isPending}
              className="gap-1.5"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  {t.communityFollowingBtn}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t.communityFollow}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      {user.badges.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Award className="h-4 w-4 text-primary" />
            {t.profileBadges}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user.badges.map((badge) => (
              <BadgePill
                key={badge.id}
                name={badge.name}
                icon={badge.icon}
                description={badge.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t.userProfileReviews} {user.name}
        </h2>
        {user.reviews.length === 0 ? (
          <EmptyState title={t.userProfileNoReviews} description={t.userProfileNoReviewsDesc} />
        ) : (
          <div className="space-y-4">
            {user.reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="flex gap-4 p-4">
                  <Link href={`/shops/${review.shop.slug}`} className="shrink-0">
                    <img
                      src={review.shop.imageUrl}
                      alt={review.shop.name}
                      className="h-20 w-20 rounded-xl border object-cover sm:h-24 sm:w-24"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                      {review.shop.city} • ★ {formatRating(review.shop.averageRating)} •{' '}
                      {formatDate(review.createdAt)}
                    </p>
                    {review.title && <p className="mt-1 text-sm font-semibold">{review.title}</p>}
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
