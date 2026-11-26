'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Award, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgePill } from '@/components/badges/badge-pill';
import { EmptyState } from '@/components/states/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/components/language-provider';
import type { UserBadgeItem } from '@/types';

interface ProfileResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    city: string | null;
    createdAt: string;
    badges: UserBadgeItem[];
  };
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [email, setEmail] = useState('');
  const [badges, setBadges] = useState<UserBadgeItem[]>([]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    fetch('/api/profile')
      .then((res) => res.json())
      .then((data: ProfileResponse) => {
        if (data.user) {
          setName(data.user.name ?? '');
          setCity(data.user.city ?? '');
          setBio(data.user.bio ?? '');
          setImage(data.user.image ?? '');
          setEmail(data.user.email);
          setBadges(data.user.badges ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [status]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || null,
          bio: bio.trim() || null,
          image: image.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.profileSaveFailed);

      await update({ name: data.user.name, image: data.user.image });
      toast.success(t.profileUpdated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profileSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={UserIcon}
          title={t.profileSignInTitle}
          description={t.profileSignInDesc}
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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={image || undefined} alt={name} />
            <AvatarFallback>{name?.slice(0, 2).toUpperCase() || 'CM'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{name || t.profileCoffeeExplorer}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profileTitle}</CardTitle>
          <CardDescription>{t.profileDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">{t.profileName}</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-city">{t.profileHomeCity}</Label>
              <Input
                id="profile-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t.profileHomeCityPlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-image">{t.profileAvatar}</Label>
              <Input
                id="profile-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-bio">{t.profileBio}</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.profileBioPlaceholder}
                maxLength={300}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? t.saving : t.saveChanges}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            {t.profileBadges}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.profileNoBadges}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {badges.map((badge) => (
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
    </main>
  );
}
