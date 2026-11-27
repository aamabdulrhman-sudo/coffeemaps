'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Coffee, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/language-provider';

export default function CafeSignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    password: '',
    shopName: '',
    city: '',
    address: '',
    description: '',
    openingHours: '',
    googleMapsUrl: '',
    imageUrl: '',
    stampsGoal: '8',
    reward: '',
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/cafe-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.cafeSignupFailed);

      // Auto sign-in with the new cafe account
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });

      toast.success(t.cafeSignupSuccess);
      router.push('/cafe');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.cafeSignupFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">{t.cafeSignupTitle}</CardTitle>
          <CardDescription>{t.cafeSignupDesc}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.cafeSignupAccountSection}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="owner">{t.fullName}</Label>
                <Input
                  id="owner"
                  value={form.ownerName}
                  onChange={(e) => update('ownerName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cafe-email">{t.email}</Label>
                <Input
                  id="cafe-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cafe-password">{t.password}</Label>
                <Input
                  id="cafe-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder={t.authPasswordHint}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.cafeSignupShopSection}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shop-name">{t.adminShopName}</Label>
                <Input
                  id="shop-name"
                  value={form.shopName}
                  onChange={(e) => update('shopName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-city">{t.adminShopCity}</Label>
                <Input
                  id="shop-city"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="shop-address">{t.adminShopAddress}</Label>
                <Input
                  id="shop-address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="shop-desc">{t.adminShopDescription}</Label>
                <Textarea
                  id="shop-desc"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-hours">{t.adminShopHours}</Label>
                <Input
                  id="shop-hours"
                  value={form.openingHours}
                  onChange={(e) => update('openingHours', e.target.value)}
                  placeholder="7:00 AM - 12:00 AM"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shop-maps">{t.adminShopMapsUrl}</Label>
                <Input
                  id="shop-maps"
                  type="url"
                  value={form.googleMapsUrl}
                  onChange={(e) => update('googleMapsUrl', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="shop-image">{t.adminShopImage}</Label>
                <Input
                  id="shop-image"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => update('imageUrl', e.target.value)}
                  placeholder="https://... (اختياري)"
                />
              </div>
            </div>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.cafeSignupLoyaltySection}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loyalty-goal">{t.adminLoyaltyGoal}</Label>
                <Input
                  id="loyalty-goal"
                  type="number"
                  min={3}
                  max={30}
                  value={form.stampsGoal}
                  onChange={(e) => update('stampsGoal', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loyalty-reward">{t.adminLoyaltyReward}</Label>
                <Input
                  id="loyalty-reward"
                  value={form.reward}
                  onChange={(e) => update('reward', e.target.value)}
                  placeholder="☕"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.loading : t.cafeSignupBtn}
            </Button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Coffee className="h-3.5 w-3.5" />
            {t.cafeSignupNote}
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t.authHaveAccount}{' '}
            <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
              {t.signIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
