'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MapPin, MessageSquare, Search, UserCheck, UserPlus, Users } from 'lucide-react';
import { useCommunity, useToggleFollow } from '@/hooks/use-coffeemap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';

export default function CommunityPage() {
  const { data: session } = useSession();
  const { t, formatDate } = useI18n();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const follow = useToggleFollow();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, refetch } = useCommunity(debounced);
  const members = data?.users ?? [];

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Users}
          title={t.communitySignInTitle}
          description={t.communitySignInDesc}
        />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/auth/signin">{t.signIn}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Users className="h-7 w-7 text-primary" />
          {t.communityTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.communitySubtitle}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.communitySearchPlaceholder}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title={t.communityEmpty} description={t.communityEmptyDesc} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const initials =
              member.name
                ?.split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() ?? 'CM';

            return (
              <Card key={member.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/users/${member.id}`} className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={member.image ?? undefined} alt={member.name ?? ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="line-clamp-1 text-sm font-semibold hover:text-primary">
                          {member.name ?? t.profileCoffeeExplorer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.communityMemberSince} {formatDate(member.createdAt)}
                        </p>
                      </div>
                    </Link>

                    {!member.isSelf && (
                      <Button
                        size="sm"
                        variant={member.isFollowing ? 'secondary' : 'default'}
                        className={cn('h-8 gap-1 text-xs')}
                        disabled={follow.isPending}
                        onClick={() => follow.mutate(member.id)}
                      >
                        {member.isFollowing ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            {t.communityFollowingBtn}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            {t.communityFollow}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {member.bio && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {member.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {member.city}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {member._count.reviews} {t.communityReviewsCount}
                    </span>
                    <span>
                      {member._count.followers} {t.profileFollowers}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
