'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/language-provider';

export default function AdminSetupPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, setupToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Setup failed');
      setDone(true);
      toast.success('Platform admin created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Platform Admin Setup</CardTitle>
          <CardDescription>
            Create the platform admin account. Requires the ADMIN_SETUP_TOKEN from the server
            environment.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Admin account created for <strong>{email}</strong>. You can now sign in.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/signin">{t.signIn}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="setup-token">
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Setup Token (ADMIN_SETUP_TOKEN)
                  </span>
                </Label>
                <Input
                  id="setup-token"
                  type="password"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="From server .env"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-name">{t.fullName}</Label>
                <Input
                  id="setup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-email">{t.email}</Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@coffeemap.app"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup-password">{t.password}</Label>
                <Input
                  id="setup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.authPasswordHint}
                  minLength={8}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.loading : 'Create platform admin'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
