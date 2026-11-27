'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Coffee,
  Gift,
  ImagePlus,
  Layers,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/states/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/components/language-provider';
import { cn } from '@/lib/utils';
import type { TagItem } from '@/types';

/* ---------------- Types ---------------- */

interface AdminShop {
  id: string;
  name: string;
  slug: string;
  city: string;
  imageUrl: string;
  averageRating: number;
  reviewCount: number;
  tags: TagItem[];
  loyaltyProgram?: { id: string } | null;
  _count: { reviews: number; favorites: number };
}

interface AdminBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  shopId?: string | null;
  active: boolean;
  priority: number;
  clicks: number;
  shop?: { id: string; name: string; slug: string } | null;
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  city: string | null;
  image: string | null;
  createdAt: string;
  shopId?: string | null;
  operatedShop?: { id: string; name: string } | null;
  _count: { reviews: number; followers: number; following: number };
}

interface LoyaltyProgram {
  id: string;
  shopId: string;
  stampsGoal: number;
  reward: string;
  active: boolean;
  shop: { id: string; name: string; slug: string; city: string };
  _count: { balances: number };
}

/* ---------------- Page ---------------- */

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const isAdmin = session?.user?.role === 'ADMIN';

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={ShieldCheck} title={t.adminForbidden} description={t.adminSignInFirst} />
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
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <ShieldCheck className="h-7 w-7 text-primary" />
          {t.adminTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.adminSubtitle}</p>
      </div>

      <Tabs defaultValue="shops" dir="ltr">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="shops" className="gap-1.5">
            <Coffee className="h-4 w-4" />
            {t.adminShopsTab}
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            {t.adminBannersTab}
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1.5">
            <Gift className="h-4 w-4" />
            {t.adminLoyaltyTab}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <UsersIcon className="h-4 w-4" />
            {t.adminUsersTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shops">
          <ShopsAdmin />
        </TabsContent>
        <TabsContent value="banners">
          <BannersAdmin />
        </TabsContent>
        <TabsContent value="loyalty">
          <LoyaltyAdmin />
        </TabsContent>
        <TabsContent value="users">
          <UsersAdmin />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* ---------------- Shops Admin ---------------- */

function ShopsAdmin() {
  const { t } = useI18n();
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    name: '',
    description: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
    latitude: '',
    longitude: '',
    imageUrl: '',
    openingHours: '',
    googleMapsUrl: '',
    tagSlugs: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    setLoading(true);
    try {
      const [shopsRes, shopsListRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/admin/shops'),
      ]);
      const shopsData = await shopsRes.json();
      const adminData = await shopsListRes.json();
      if (adminData.shops) setShops(adminData.shops);
      if (shopsData.tags) setTags(shopsData.tags);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(shop: AdminShop) {
    setEditingId(shop.id);
    setForm({
      name: shop.name,
      description: '',
      address: '',
      city: shop.city,
      country: 'Saudi Arabia',
      latitude: '',
      longitude: '',
      imageUrl: shop.imageUrl,
      openingHours: '',
      googleMapsUrl: '',
      tagSlugs: shop.tags.map((tg) => tg.slug),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        city: form.city,
        imageUrl: form.imageUrl,
        tagSlugs: form.tagSlugs,
      };
      if (form.description) payload.description = form.description;
      if (form.address) payload.address = form.address;
      if (form.country) payload.country = form.country;
      if (form.latitude) payload.latitude = Number(form.latitude);
      if (form.longitude) payload.longitude = Number(form.longitude);
      if (form.openingHours) payload.openingHours = form.openingHours;
      if (form.googleMapsUrl) payload.googleMapsUrl = form.googleMapsUrl;

      const res = await fetch(editingId ? `/api/admin/shops/${editingId}` : '/api/admin/shops', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(editingId ? t.adminShopUpdated : t.adminShopCreated);
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminDeleteConfirm)) return;
    try {
      const res = await fetch(`/api/admin/shops/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(t.adminShopDeleted);
      setShops((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  function toggleTag(slug: string) {
    setForm((prev) => ({
      ...prev,
      tagSlugs: prev.tagSlugs.includes(slug)
        ? prev.tagSlugs.filter((s) => s !== slug)
        : [...prev.tagSlugs, slug],
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t.adminCreateShopHint}</p>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t.adminAddShop}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">
              {editingId ? t.adminEditShop : t.adminAddShop}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm} aria-label={t.cancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.adminShopName}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminShopCity}</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminShopDescription}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminShopAddress}</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminShopLatitude}</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminShopLongitude}</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminShopImage}</Label>
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminShopHours}</Label>
                <Input
                  value={form.openingHours}
                  onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                  placeholder="7:00 AM - 12:00 AM"
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminShopMapsUrl}</Label>
                <Input
                  type="url"
                  value={form.googleMapsUrl}
                  onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminShopTags}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const active = form.tagSlugs.includes(tag.slug);
                    return (
                      <button
                        key={tag.slug}
                        type="button"
                        onClick={() => toggleTag(tag.slug)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {form.tagSlugs.length === 0 && (
                  <p className="text-xs text-destructive">{t.adminShopTagsHint}</p>
                )}
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving || form.tagSlugs.length === 0}>
                  {saving ? t.saving : t.save}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  {t.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState icon={Coffee} title={t.adminNoShops} description={t.adminCreateShopHint} />
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <Card key={shop.id} className="py-3">
              <CardContent className="flex flex-wrap items-center gap-3 px-4">
                <img
                  src={shop.imageUrl}
                  alt={shop.name}
                  className="h-14 w-14 shrink-0 rounded-xl border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shops/${shop.slug}`}
                    className="line-clamp-1 font-semibold hover:text-primary"
                  >
                    {shop.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {shop.city} • ★ {shop.averageRating.toFixed(1)} • {shop._count.reviews}{' '}
                    {t.reviews} • {shop._count.favorites} ♥
                  </p>
                </div>
                {shop.loyaltyProgram && (
                  <Badge variant="accent" className="gap-1">
                    <Gift className="h-3 w-3" />
                    {t.adminLoyaltyTab}
                  </Badge>
                )}
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startEdit(shop)}
                    aria-label={t.edit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(shop.id)}
                    aria-label={t.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Banners Admin ---------------- */

function BannersAdmin() {
  const { t } = useI18n();
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    shopId: 'none',
    priority: '0',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [bannersRes, shopsRes] = await Promise.all([
        fetch('/api/admin/banners'),
        fetch('/api/admin/shops'),
      ]);
      const bannersData = await bannersRes.json();
      const shopsData = await shopsRes.json();
      if (bannersData.banners) setBanners(bannersData.banners);
      if (shopsData.shops) setShops(shopsData.shops);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  /** Selecting a coffee shop auto-fills the banner data from the shop. */
  function handleShopSelect(shopId: string) {
    if (shopId === 'none') {
      setForm((prev) => ({ ...prev, shopId }));
      return;
    }
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return;
    setForm((prev) => ({
      ...prev,
      shopId,
      title: prev.shopId === 'none' && !prev.title ? shop.name : prev.title,
      subtitle: shop.city,
      imageUrl: prev.imageUrl || shop.imageUrl,
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success(t.reviewPhotoUploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle || null,
          imageUrl: form.imageUrl || null,
          linkUrl: form.linkUrl || null,
          shopId: form.shopId === 'none' ? null : form.shopId,
          priority: Number(form.priority) || 0,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(t.adminBannerCreated);
      setShowForm(false);
      setForm({
        title: '',
        subtitle: '',
        imageUrl: '',
        linkUrl: '',
        shopId: 'none',
        priority: '0',
      });
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(banner: AdminBanner) {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !banner.active }),
      });
      if (!res.ok) throw new Error(t.adminFailed);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminDeleteConfirm)) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t.adminFailed);
      toast.success(t.adminBannerDeleted);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t.adminBannerPriority}</p>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t.adminAddBanner}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.adminAddBanner}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Featured shop — auto-fills banner data */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminBannerShop}</Label>
                <Select value={form.shopId} onValueChange={handleShopSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminShopName} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name} — {shop.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t.adminBannerShopHint}</p>
              </div>

              <div className="space-y-1.5">
                <Label>{t.adminBannerTitle}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminBannerSubtitle}</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              {/* Banner image: upload from device or paste URL (optional when a shop is selected) */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t.adminBannerImage}</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {form.imageUrl && (
                    <div className="relative h-20 w-36 overflow-hidden rounded-xl border">
                      <img
                        src={form.imageUrl}
                        alt="Banner preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={t.reviewRemovePhoto}
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
                    <ImagePlus className="h-4 w-4" />
                    {uploading ? t.reviewUploading : t.reviewAddPhoto}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder={t.adminBannerImageOptional}
                />
                {form.shopId === 'none' && !form.imageUrl && (
                  <p className="text-xs text-destructive">{t.adminBannerImageRequired}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>{t.adminBannerPriority}</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.adminBannerLink}</Label>
                <Input
                  type="url"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button
                  type="submit"
                  disabled={saving || uploading || (form.shopId === 'none' && !form.imageUrl)}
                >
                  {saving ? t.saving : t.save}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  {t.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <EmptyState icon={Megaphone} title={t.adminNoBanners} description={t.adminAddBanner} />
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <Card key={banner.id} className="py-3">
              <CardContent className="flex flex-wrap items-center gap-3 px-4">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-14 w-24 shrink-0 rounded-xl border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                    <Megaphone className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-semibold">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{banner.subtitle}</p>
                  )}
                  {banner.shop && (
                    <Link
                      href={`/shops/${banner.shop.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {banner.shop.name}
                    </Link>
                  )}
                </div>
                {/* Click statistics */}
                <Badge variant="accent" className="gap-1">
                  <MousePointerClick className="h-3 w-3" />
                  {banner.clicks} {t.adminBannerClicks}
                </Badge>
                <Badge variant={banner.active ? 'default' : 'outline'}>
                  {t.adminBannerActive}: {banner.active ? '✓' : '✗'}
                </Badge>
                <span className="text-xs text-muted-foreground">#{banner.priority}</span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(banner)}>
                    {banner.active ? '✗' : '✓'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                    aria-label={t.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Loyalty Admin ---------------- */

function LoyaltyAdmin() {
  const { t } = useI18n();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shopId: '', stampsGoal: '8', reward: '' });

  async function loadData() {
    setLoading(true);
    try {
      const [programsRes, shopsRes] = await Promise.all([
        fetch('/api/admin/loyalty'),
        fetch('/api/admin/shops'),
      ]);
      const programsData = await programsRes.json();
      const shopsData = await shopsRes.json();
      if (programsData.programs) setPrograms(programsData.programs);
      if (shopsData.shops) setShops(shopsData.shops);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: form.shopId,
          stampsGoal: Number(form.stampsGoal),
          reward: form.reward,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(t.adminLoyaltyCreated);
      setForm({ shopId: '', stampsGoal: '8', reward: '' });
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminDeleteConfirm)) return;
    try {
      const res = await fetch(`/api/admin/loyalty?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t.adminFailed);
      toast.success(t.adminLoyaltyDeleted);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.adminLoyaltyTitle}</CardTitle>
          <CardDescription>{t.adminLoyaltyDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t.adminShopsTab}</Label>
              <Select value={form.shopId} onValueChange={(v) => setForm({ ...form, shopId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.adminShopName} />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} — {shop.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.adminLoyaltyGoal}</Label>
              <Input
                type="number"
                min={3}
                max={30}
                value={form.stampsGoal}
                onChange={(e) => setForm({ ...form, stampsGoal: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.adminLoyaltyReward}</Label>
              <Input
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                placeholder="☕ Free cortado"
                required
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={saving || !form.shopId}>
                {saving ? t.saving : t.adminLoyaltySave}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState icon={Gift} title={t.adminLoyaltyEmpty} description={t.adminLoyaltyDesc} />
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <Card key={program.id} className="py-3">
              <CardContent className="flex flex-wrap items-center gap-3 px-4">
                <Gift className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shops/${program.shop.slug}`}
                    className="font-semibold hover:text-primary"
                  >
                    {program.shop.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {program.stampsGoal} {t.dashStamps} → {program.reward} •{' '}
                    {program._count.balances} {t.dashLoyalty}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(program.id)}
                  aria-label={t.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Users Admin ---------------- */

function UsersAdmin() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-user shop selection while role = SHOP (before saving)
  const [pendingShop, setPendingShop] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, shopsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/shops'),
      ]);
      const usersData = await usersRes.json();
      const shopsData = await shopsRes.json();
      if (usersData.users) setUsers(usersData.users);
      if (shopsData.shops) setShops(shopsData.shops);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function changeRole(userId: string, role: string, shopId?: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, shopId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(t.adminUserUpdated);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role,
                shopId: shopId ?? null,
                operatedShop: shopId
                  ? shops.find((s) => s.id === shopId)
                    ? { id: shopId, name: shops.find((s) => s.id === shopId)!.name }
                    : u.operatedShop
                  : null,
              }
            : u
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.adminUsersTitle}</CardTitle>
          <CardDescription>{t.adminUsersDesc}</CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="py-3">
              <CardContent className="flex flex-wrap items-center gap-3 px-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/users/${user.id}`} className="font-semibold hover:text-primary">
                    {user.name ?? '—'}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email} • {user._count.reviews} {t.reviews} • {user._count.followers}{' '}
                    {t.profileFollowers}
                  </p>
                  {user.role === 'SHOP' && (
                    <p className="text-xs font-medium text-primary">
                      <Store className="mr-1 inline h-3 w-3" />
                      {user.operatedShop?.name ?? t.adminNoShopLinked}
                    </p>
                  )}
                </div>
                {user.id === session?.user?.id ? (
                  <Badge className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {t.adminRoleAdmin}
                  </Badge>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {user.role === 'SHOP' && (
                      <Select
                        value={
                          pendingShop[user.id] ?? user.shopId ?? user.operatedShop?.id ?? 'none'
                        }
                        onValueChange={(v) => {
                          setPendingShop((prev) => ({ ...prev, [user.id]: v }));
                          changeRole(user.id, 'SHOP', v === 'none' ? undefined : v);
                        }}
                      >
                        <SelectTrigger className="w-[170px]" aria-label={t.adminShopCity}>
                          <SelectValue placeholder={t.adminShopName} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {shops.map((shop) => (
                            <SelectItem key={shop.id} value={shop.id}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={user.role}
                      onValueChange={(v) => changeRole(user.id, v, pendingShop[user.id])}
                    >
                      <SelectTrigger className="w-[130px]" aria-label={t.adminUserRole}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">{t.adminRoleUser}</SelectItem>
                        <SelectItem value="SHOP">{t.adminRoleShop}</SelectItem>
                        <SelectItem value="ADMIN">{t.adminRoleAdmin}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
