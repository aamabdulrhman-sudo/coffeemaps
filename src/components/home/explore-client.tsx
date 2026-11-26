'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Flame, List, Map as MapIcon, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useShops, useToggleFavorite, type ShopFilterParams } from '@/hooks/use-coffeemap';
import { ShopFilters, type CityMode } from '@/components/shops/shop-filters';
import { ShopCard } from '@/components/shops/shop-card';
import { MapWrapper } from '@/components/map/map-wrapper';
import { ShopGridSkeleton } from '@/components/states/loading-skeletons';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { AdBanners } from '@/components/ads/ad-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/language-provider';

const CITY_STORAGE_KEY = 'coffeemap_preferred_city';
const MODE_STORAGE_KEY = 'coffeemap_city_mode';

const INITIAL_FILTERS: ShopFilterParams = {
  q: '',
  minRating: 0,
  tags: [],
  sort: 'trending',
};

export function ExploreClient() {
  const { status: sessionStatus } = useSession();
  const { t } = useI18n();
  const [filters, setFilters] = useState<ShopFilterParams>(INITIAL_FILTERS);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cityMode, setCityMode] = useState<CityMode>('priority');
  const [citySource, setCitySource] = useState<'manual' | 'gps' | 'profile' | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'split' | 'list' | 'map'>('split');
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.q ?? '');
    }, 250);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const detectFromCoords = useCallback(
    async (lat: number, lng: number, silent = false) => {
      setUserLocation({ lat, lng });
      setFilters((prev) => ({ ...prev, sort: 'nearest' }));

      try {
        const res = await fetch(`/api/location/city?lat=${lat}&lng=${lng}`);
        const data = (await res.json()) as { city?: string | null };
        if (data.city) {
          setSelectedCity(data.city);
          setCitySource('gps');
          window.localStorage.setItem(CITY_STORAGE_KEY, data.city);
          if (!silent) {
            toast.success(
              `${t.exploreDetectedCity}: ${data.city} — ${t.explorePrioritizing} ${data.city}`
            );
          }
        } else if (!silent) {
          toast.success(t.exploreLocationDetected);
        }
      } catch {
        if (!silent) {
          toast.success(t.exploreLocationDetected);
        }
      }
    },
    [t]
  );

  // Restore manual/saved city preference, or auto-detect if permission granted / profile city set
  useEffect(() => {
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY);
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY) as CityMode | null;

    if (savedMode === 'priority' || savedMode === 'only') {
      setCityMode(savedMode);
    }

    if (savedCity && savedCity !== 'all') {
      setSelectedCity(savedCity);
      setCitySource('manual');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition((pos) => {
              void detectFromCoords(pos.coords.latitude, pos.coords.longitude, true);
            });
          }
        })
        .catch(() => {
          // Permissions API unsupported
        });
    }
  }, [detectFromCoords]);

  // If no saved city yet and user is authenticated with a profile city, prioritize it
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    if (selectedCity !== 'all') return;
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY);
    if (savedCity) return;

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: { city?: string | null } } | null) => {
        const profileCity = data?.user?.city?.trim();
        if (profileCity) {
          setSelectedCity(profileCity);
          setCitySource('profile');
        }
      })
      .catch(() => {});
  }, [sessionStatus, selectedCity]);

  const queryFilters = useMemo<ShopFilterParams>(
    () => ({
      ...filters,
      q: debouncedQuery,
      city: selectedCity !== 'all' && cityMode === 'only' ? selectedCity : undefined,
      priorityCity: selectedCity !== 'all' && cityMode === 'priority' ? selectedCity : undefined,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    }),
    [filters, debouncedQuery, selectedCity, cityMode, userLocation]
  );

  const { data, isLoading, isError, refetch } = useShops(queryFilters);
  const toggleFavorite = useToggleFavorite();

  function handleSelectCity(city: string) {
    setSelectedCity(city);
    setCitySource(city === 'all' ? null : 'manual');
    if (city === 'all') {
      window.localStorage.removeItem(CITY_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CITY_STORAGE_KEY, city);
      toast.success(
        cityMode === 'priority'
          ? `${t.explorePrioritizingCity} ${city}`
          : `${t.exploreShowingCity} ${city}`
      );
    }
  }

  function handleChangeCityMode(mode: CityMode) {
    setCityMode(mode);
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error(t.exploreGeoUnsupported);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await detectFromCoords(position.coords.latitude, position.coords.longitude, false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error(t.exploreGeoError);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleClearLocation() {
    setUserLocation(null);
    setFilters((prev) => ({
      ...prev,
      sort: prev.sort === 'nearest' ? 'trending' : prev.sort,
    }));
    if (citySource === 'gps') {
      setSelectedCity('all');
      setCitySource(null);
      window.localStorage.removeItem(CITY_STORAGE_KEY);
    }
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setUserLocation(null);
    setSelectedCity('all');
    setCitySource(null);
    setCityMode('priority');
    window.localStorage.removeItem(CITY_STORAGE_KEY);
    window.localStorage.removeItem(MODE_STORAGE_KEY);
  }

  const shops = useMemo(() => data?.shops ?? [], [data?.shops]);
  const activePriorityCity =
    data?.activePriorityCity ?? (selectedCity !== 'all' ? selectedCity : null);
  const priorityShops = useMemo(() => shops.filter((s) => s.isPriorityCity), [shops]);
  const otherShops = useMemo(() => shops.filter((s) => !s.isPriorityCity), [shops]);

  const trendingTop = useMemo(
    () => [...shops].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 3),
    [shops]
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <ShopFilters
        filters={filters}
        selectedCity={selectedCity}
        cityMode={cityMode}
        citySource={citySource}
        cities={data?.cities ?? []}
        tags={data?.tags ?? []}
        hasLocation={Boolean(userLocation)}
        locating={locating}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSelectCity={handleSelectCity}
        onChangeCityMode={handleChangeCityMode}
        onLocateMe={handleLocateMe}
        onClearLocation={handleClearLocation}
        onReset={handleReset}
      />

      {/* Mobile View Switcher */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2 lg:hidden">
        <span className="text-xs font-medium text-muted-foreground">
          {shops.length} {t.exploreCount}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mobileView !== 'map' ? 'default' : 'outline'}
            onClick={() => setMobileView('list')}
            className="h-8 gap-1 text-xs"
          >
            <List className="h-3.5 w-3.5" />
            {t.exploreList}
          </Button>
          <Button
            size="sm"
            variant={mobileView === 'map' ? 'default' : 'outline'}
            onClick={() => setMobileView('map')}
            className="h-8 gap-1 text-xs"
          >
            <MapIcon className="h-3.5 w-3.5" />
            {t.exploreMap}
          </Button>
        </div>
      </div>

      {/* Main Full-Screen Split View */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Left List Panel */}
        <section
          className={`overflow-y-auto p-4 sm:p-6 lg:col-span-6 xl:col-span-5 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Ad Banners Carousel */}
          <div className="mb-5">
            <AdBanners />
          </div>

          {/* Trending / Nearby Banner */}
          {trendingTop.length > 0 && !isLoading && (
            <div className="mb-5 rounded-2xl border bg-gradient-to-r from-coffee-50 via-background to-amber-50/60 p-4 dark:from-coffee-950/50 dark:via-background dark:to-amber-950/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  {activePriorityCity ? (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      {t.explorePriorityIn} {activePriorityCity}
                    </>
                  ) : userLocation ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {t.exploreSuggestedNearby}
                    </>
                  ) : (
                    <>
                      <Flame className="h-3.5 w-3.5" />
                      {t.exploreTrending}
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shops.length} {t.exploreSpotsFound}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTop.map((shop) => (
                  <Link key={shop.id} href={`/shops/${shop.slug}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer bg-background/80 py-1 hover:border-primary"
                    >
                      {shop.name} • ★ {shop.averageRating.toFixed(1)}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <ShopGridSkeleton count={6} />
          ) : isError ? (
            <ErrorState
              title={t.exploreLoadError}
              message={t.exploreLoadErrorDesc}
              onRetry={() => refetch()}
            />
          ) : shops.length === 0 ? (
            <EmptyState
              title={t.exploreNoMatches}
              description={t.exploreNoMatchesDesc}
              actionLabel={t.exploreResetAll}
              onAction={handleReset}
            />
          ) : activePriorityCity && cityMode === 'priority' ? (
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t.exploreInCity} {activePriorityCity} ({priorityShops.length})
                  </h2>
                </div>
                {priorityShops.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {priorityShops.map((shop) => (
                      <ShopCard
                        key={shop.id}
                        shop={shop}
                        isSelected={selectedShopId === shop.id}
                        onHover={setSelectedShopId}
                        onToggleFavorite={(shopId) => toggleFavorite.mutate(shopId)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                    {t.exploreNoCityShops.replace('{city}', activePriorityCity)}
                  </p>
                )}
              </div>

              {otherShops.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                    {t.exploreOtherCities} ({otherShops.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {otherShops.map((shop) => (
                      <ShopCard
                        key={shop.id}
                        shop={shop}
                        isSelected={selectedShopId === shop.id}
                        onHover={setSelectedShopId}
                        onToggleFavorite={(shopId) => toggleFavorite.mutate(shopId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  isSelected={selectedShopId === shop.id}
                  onHover={setSelectedShopId}
                  onToggleFavorite={(shopId) => toggleFavorite.mutate(shopId)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Full-Height Interactive Map */}
        <section
          className={`relative h-full min-h-[380px] p-2 sm:p-4 lg:col-span-6 xl:col-span-7 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <MapWrapper
            shops={shops}
            selectedShopId={selectedShopId}
            activePriorityCity={activePriorityCity}
            onSelectShop={setSelectedShopId}
            userLocation={userLocation}
          />
        </section>
      </div>
    </div>
  );
}
