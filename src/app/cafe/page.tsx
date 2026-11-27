'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Coffee,
  Gift,
  MinusCircle,
  PlusCircle,
  ScanLine,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/states/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LookedUpCard {
  id: string;
  code: string;
  stamps: number;
  redemptions: number;
  completedAt?: string | null;
  updatedAt: string;
  program: {
    id: string;
    stampsGoal: number;
    reward: string;
    shop: { id: string; name: string; slug: string; city: string };
  };
  user: { id: string; name: string | null; image: string | null };
}

export default function CafeConsolePage() {
  const { data: session, status } = useSession();
  const { t, formatDate } = useI18n();
  const [code, setCode] = useState('');
  const [card, setCard] = useState<LookedUpCard | null>(null);
  const [looking, setLooking] = useState(false);
  const [acting, setActing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isShopStaff = session?.user?.role === 'SHOP' || session?.user?.role === 'ADMIN';

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setLooking(true);
    setNotFound(false);
    setCard(null);
    try {
      const res = await fetch(`/api/cafe/loyalty?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) setNotFound(true);
        throw new Error(data.error ?? t.adminFailed);
      }
      setCard(data.card);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setLooking(false);
    }
  }

  async function handleAction(action: 'add' | 'redeem') {
    if (!card) return;
    setActing(true);
    try {
      const res = await fetch('/api/cafe/loyalty/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: card.code, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      setCard((prev) => (prev ? { ...prev, ...data.card } : prev));
      toast.success(data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setActing(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 py-10">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    );
  }

  if (!isShopStaff) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Store}
          title={t.cafeConsoleForbidden}
          description={t.cafeConsoleForbiddenDesc}
        />
      </main>
    );
  }

  const goal = card?.program.stampsGoal ?? 8;
  const progress = card ? Math.min(card.stamps, goal) : 0;
  const rewardReady = card ? card.stamps >= goal : false;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-8">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="h-6 w-6 text-primary" />
          {t.cafeConsoleTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.cafeConsoleSubtitle}</p>
      </div>

      {/* Card code lookup */}
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleLookup} className="space-y-3">
            <Label htmlFor="card-code">{t.cafeConsoleCardCode}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="card-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CM-XXXX-XXXX"
                  className="pl-9 font-mono tracking-widest"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={looking || !code.trim()}>
                {looking ? t.loading : t.cafeConsoleVerify}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t.cafeConsoleScanHint}</p>
            {notFound && (
              <p className="text-xs font-medium text-destructive">{t.cafeConsoleNotFound}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Customer card result */}
      {card && (
        <Card
          className={cn(
            'overflow-hidden border-none bg-gradient-to-br text-white shadow-lg',
            rewardReady
              ? 'from-primary to-coffee-700'
              : 'from-coffee-800 to-coffee-950 dark:from-coffee-900 dark:to-background'
          )}
        >
          <CardContent className="space-y-4 p-5">
            {/* Customer info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-white/30">
                  <AvatarImage src={card.user.image ?? undefined} alt={card.user.name ?? ''} />
                  <AvatarFallback className="bg-white/15 text-white">
                    <UserRound className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{card.user.name ?? t.profileCoffeeExplorer}</p>
                  <p className="font-mono text-xs text-white/70">{card.code}</p>
                </div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-1.5">
                <QRCodeSVG value={card.code} size={52} level="M" aria-hidden />
              </div>
            </div>

            {/* Stamps */}
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
            <p className="text-[10px] text-white/50">
              {t.walletLastUpdate}: {formatDate(card.updatedAt)}
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAction('add')}
                disabled={acting}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <PlusCircle className="h-4 w-4" />
                {t.cafeConsoleAddStamp}
              </Button>
              <Button
                onClick={() => handleAction('redeem')}
                disabled={acting || !rewardReady}
                className="gap-1.5 bg-white/15 text-white hover:bg-white/25"
                variant="secondary"
              >
                <MinusCircle className="h-4 w-4" />
                {t.cafeConsoleRedeem}
              </Button>
            </div>
            {rewardReady && (
              <p className="text-center text-xs font-bold text-amber-300">
                🎁 {t.cafeConsoleRewardReady}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!card && !notFound && (
        <div className="rounded-2xl border border-dashed p-6 text-center">
          <Coffee className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t.cafeConsoleEmptyHint}</p>
        </div>
      )}

      {session?.user?.role === 'ADMIN' && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t.cafeConsoleAdminNote}
        </p>
      )}
    </main>
  );
}
