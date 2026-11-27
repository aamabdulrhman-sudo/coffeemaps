'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Coffee, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/components/language-provider';

export default function SignInPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(t.authInvalid);
      return;
    }

    toast.success(t.authWelcomeBack);
    router.push('/');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coffee className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">{t.authSignInTitle}</CardTitle>
          <CardDescription>{t.authSignInDesc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            {t.authGoogle}
          </Button>

          <div className="relative flex items-center py-1">
            <Separator className="flex-1" />
            <span className="px-3 text-xs uppercase text-muted-foreground">{t.or}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">{t.email}</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@coffeemap.app"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signin-password">{t.password}</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.authSigningIn : t.authEmailSignIn}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t.authNewPrompt}{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
              {t.authCreateAccount}
            </Link>
          </p>

          <div className="rounded-xl border border-dashed p-3 text-center">
            <p className="text-xs text-muted-foreground">
              <Store className="mr-1 inline h-3.5 w-3.5" />
              {t.cafeSignupPrompt}{' '}
              <Link href="/auth/cafe-signup" className="font-semibold text-primary hover:underline">
                {t.cafeSignupLink}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
