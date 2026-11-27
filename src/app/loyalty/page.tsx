'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Coffee,
  Gift,
  PlusCircle,
  RefreshCw,
  Share2,
  Smartphone,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';
import type { LoyaltyWalletData } from '@/types';

export default function LoyaltyWalletPage() {
  const { data: session, status } = useSession();
  const { t, formatDate } = useI18n();
  const [wallet, setWallet] = useState<LoyaltyWalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [walletStatus, setWalletStatus] = useState<{ apple: boolean; google: boolean }>({
    apple: false,
    google: false,
  });

  async function loadWallet() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/loyalty/my');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setWallet(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      void loadWallet();
      fetch('/api/loyalty/wallet/status')
        .then((r) => r.json())
        .then(setWalletStatus)
        .catch(() => {});
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  async function openGoogleWallet() {
    try {
      const res = await fetch('/api/loyalty/wallet/google');
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? t.adminFailed);
      window.open(data.url, '_blank', 'noopener');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <main className="mx-auto max-w-md space-y-5 px-4 py-10">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
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

  const card = wallet?.card;
  const balances = card?.balances ?? [];

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Ticket className="h-6 w-6 text-primary" />
          {t.walletTitle}
        </h1>
        <Button variant="ghost" size="icon" onClick={loadWallet} aria-label={t.shopAiRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t.walletSubtitle}</p>

      {error ? (
        <ErrorState onRetry={loadWallet} />
      ) : !card ? (
        <EmptyState icon={Ticket} title={t.walletEmpty} description={t.walletSubtitle} />
      ) : (
        <div className="space-y-5">
          {/* Universal card — one card for ALL cafes */}
          <Card className="overflow-hidden border-none bg-gradient-to-br from-coffee-800 to-coffee-950 text-white shadow-lg dark:from-coffee-900 dark:to-background">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.walletCardBadge}</p>
                    <p className="text-xs text-white/70">{wallet?.user.name}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-300/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-coffee-900">
                  {t.walletUniversalBadge}
                </span>
              </div>

              {showQr ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-foreground">
                  <QRCodeSVG value={card.code} size={190} level="M" aria-label={t.walletQrLabel} />
                  <p className="font-mono text-lg font-bold tracking-widest">{card.code}</p>
                  <p className="text-center text-xs text-muted-foreground">{t.walletQrHint}</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                    <span className="text-white/70">{t.walletCode}</span>
                    <span className="font-mono font-bold tracking-widest">{card.code}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                    <span className="text-white/70">{t.walletMemberSince}</span>
                    <span className="text-xs">{formatDate(card.createdAt)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => setShowQr((v) => !v)}
                >
                  {showQr ? t.walletShowCard : t.walletShowQr}
                </Button>
                <Button
                  variant="secondary"
                  className="gap-1.5 bg-white/15 text-white hover:bg-white/25"
                  onClick={() => setShowGuide(true)}
                >
                  <Smartphone className="h-4 w-4" />
                  {t.walletAddToPhone}
                </Button>
              </div>

              {/* Native wallet buttons — enabled when configured on the server */}
              {walletStatus.apple && (
                <a
                  href="/api/loyalty/wallet/apple"
                  className="block rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  {t.walletApple}
                </a>
              )}
              {walletStatus.google && (
                <button
                  type="button"
                  onClick={openGoogleWallet}
                  className="w-full rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  {t.walletGoogle}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Per-cafe stamp balances — no overlap between cafes */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold">{t.walletBalancesTitle}</h2>
            {balances.length === 0 ? (
              <EmptyState
                icon={Gift}
                title={t.dashLoyaltyEmpty}
                description={t.dashLoyaltyEmptyDesc}
              />
            ) : (
              balances.map((balance) => {
                const goal = balance.program.stampsGoal;
                const progress = Math.min(balance.stamps, goal);
                const rewardReady = balance.stamps >= goal;
                return (
                  <Card key={balance.id} className="py-3">
                    <CardContent className="space-y-2.5 px-4">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/shops/${balance.program.shop.slug}`}
                          className="line-clamp-1 text-sm font-semibold hover:text-primary"
                        >
                          {balance.program.shop.name}
                        </Link>
                        {rewardReady && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            🎁 {t.cafeConsoleRewardReadyShort}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: goal }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full border text-[9px]',
                              i < progress
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-dashed border-muted-foreground/40 text-muted-foreground'
                            )}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          <span className="font-semibold text-foreground">
                            {balance.stamps}/{goal}
                          </span>{' '}
                          {t.dashStamps}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {balance.redemptions} {t.walletRedemptions}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>

          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="flip-rtl h-4 w-4" />
              {t.shopBackToMap}
            </Link>
          </Button>
        </div>
      )}

      {/* Add-to-phone guide */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              {t.walletGuideTitle}
            </DialogTitle>
            <DialogDescription>{t.walletGuideSubtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="font-semibold">📱 iPhone (Safari)</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.walletGuideIos}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="font-semibold">🤖 Android (Chrome)</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.walletGuideAndroid}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t.walletGuideNote}</p>
            <Button className="w-full" onClick={() => setShowGuide(false)}>
              {t.cancel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
