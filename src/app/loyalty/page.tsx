'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Coffee, Gift, RefreshCw, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';

interface WalletCard {
  id: string;
  code: string | null;
  stamps: number;
  redemptions: number;
  completedAt?: string | null;
  updatedAt: string;
  program: {
    id: string;
    stampsGoal: number;
    reward: string;
    shop: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string;
      city: string;
    };
  };
}

export default function LoyaltyWalletPage() {
  const { data: session, status } = useSession();
  const { t, formatDate } = useI18n();
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  async function loadCards() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/loyalty/my');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') void loadCards();
    else if (status === 'unauthenticated') setLoading(false);
  }, [status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="mx-auto max-w-md space-y-5 px-4 py-10">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={Ticket} title={t.walletSignInTitle} description={t.walletSignInDesc} />
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/auth/signin">{t.signIn}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Ticket className="h-6 w-6 text-primary" />
          {t.walletTitle}
        </h1>
        <Button variant="ghost" size="icon" onClick={loadCards} aria-label={t.shopAiRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t.walletSubtitle}</p>

      {error ? (
        <ErrorState onRetry={loadCards} />
      ) : cards.length === 0 ? (
        <EmptyState icon={Gift} title={t.dashLoyaltyEmpty} description={t.dashLoyaltyEmptyDesc} />
      ) : (
        <div className="space-y-6">
          {cards.map((card) => {
            const goal = card.program.stampsGoal;
            const progress = Math.min(card.stamps, goal);
            const rewardReady = card.stamps >= goal;
            const showQr = flippedId === card.id;

            return (
              <Card
                key={card.id}
                className={cn(
                  'overflow-hidden border-none bg-gradient-to-br shadow-lg',
                  rewardReady
                    ? 'from-primary to-coffee-700 text-primary-foreground'
                    : 'from-coffee-800 to-coffee-950 text-white dark:from-coffee-900 dark:to-background'
                )}
              >
                <CardContent className="space-y-4 p-5">
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                        <Coffee className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{card.program.shop.name}</p>
                        <p className="text-xs text-white/70">{card.program.shop.city}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {t.walletCardBadge}
                    </span>
                  </div>

                  {/* Stamps */}
                  {!showQr && (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: goal }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                              i < progress
                                ? 'border-amber-300 bg-amber-300 text-coffee-900'
                                : 'border-white/30 text-white/50'
                            )}
                          >
                            {i < progress ? '★' : i + 1}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>
                          <span className="font-bold text-white">
                            {card.stamps}/{goal}
                          </span>{' '}
                          {t.dashStamps}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {card.redemptions} {t.walletRedemptions}
                        </span>
                      </div>
                      <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
                        <span className="font-semibold">{t.dashReward}: </span>
                        {card.program.reward}
                      </p>
                      {rewardReady && (
                        <p className="text-xs font-bold text-amber-300">🎁 {t.dashCompleted}</p>
                      )}
                    </>
                  )}

                  {/* QR side — show to the cafe */}
                  {showQr && (
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-foreground">
                      <QRCodeSVG
                        value={card.code ?? card.id}
                        size={168}
                        level="M"
                        aria-label={t.walletQrLabel}
                      />
                      <p className="font-mono text-lg font-bold tracking-widest">
                        {card.code ?? '—'}
                      </p>
                      <p className="text-center text-xs text-muted-foreground">{t.walletQrHint}</p>
                    </div>
                  )}

                  {/* Flip button */}
                  <Button
                    variant="secondary"
                    className="w-full bg-white/15 text-white hover:bg-white/25"
                    onClick={() => setFlippedId(showQr ? null : card.id)}
                  >
                    {showQr ? t.walletShowCard : t.walletShowQr}
                  </Button>

                  <p className="text-center text-[10px] text-white/50">
                    {t.walletMemberSince} {formatDate(card.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="flip-rtl h-4 w-4" />
              {t.shopBackToMap}
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
