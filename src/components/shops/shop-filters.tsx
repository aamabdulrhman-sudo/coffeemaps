'use client';

import { LocateFixed, MapPin, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ShopFilterParams } from '@/hooks/use-coffeemap';
import type { TagItem } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/language-provider';

export type CityMode = 'priority' | 'only';

interface ShopFiltersProps {
  filters: ShopFilterParams;
  selectedCity: string;
  cityMode: CityMode;
  citySource: 'manual' | 'gps' | 'profile' | null;
  cities: string[];
  tags: TagItem[];
  hasLocation: boolean;
  locating: boolean;
  onChange: (next: Partial<ShopFilterParams>) => void;
  onSelectCity: (city: string) => void;
  onChangeCityMode: (mode: CityMode) => void;
  onLocateMe: () => void;
  onClearLocation: () => void;
  onReset: () => void;
}

const DEFAULT_TAGS: TagItem[] = [
  { id: 'wifi', name: 'WiFi', slug: 'wifi', icon: 'wifi' },
  { id: 'study-friendly', name: 'Study Friendly', slug: 'study-friendly', icon: 'book-open' },
  { id: 'specialty-coffee', name: 'Specialty Coffee', slug: 'specialty-coffee', icon: 'coffee' },
  { id: 'outdoor-seating', name: 'Outdoor Seating', slug: 'outdoor-seating', icon: 'trees' },
];

export function ShopFilters({
  filters,
  selectedCity,
  cityMode,
  citySource,
  cities,
  tags,
  hasLocation,
  locating,
  onChange,
  onSelectCity,
  onChangeCityMode,
  onLocateMe,
  onClearLocation,
  onReset,
}: ShopFiltersProps) {
  const { t } = useI18n();
  const displayTags = tags.length > 0 ? tags : DEFAULT_TAGS;
  const activeTags = filters.tags ?? [];

  const cityOptions =
    selectedCity && selectedCity !== 'all' && !cities.includes(selectedCity)
      ? [selectedCity, ...cities]
      : cities;

  function toggleTag(slug: string) {
    const next = activeTags.includes(slug)
      ? activeTags.filter((t) => t !== slug)
      : [...activeTags, slug];
    onChange({ tags: next });
  }

  return (
    <div className="space-y-3 border-b bg-card/80 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[210px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q ?? ''}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder={t.exploreSearch}
            className="pl-9"
            aria-label={t.exploreSearchLabel}
          />
        </div>

        <Select value={selectedCity} onValueChange={onSelectCity}>
          <SelectTrigger className="w-[165px]" aria-label={t.exploreSelectCity}>
            <MapPin className="mr-1.5 h-3.5 w-3.5 text-primary" />
            <SelectValue placeholder={t.exploreYourCity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCities}</SelectItem>
            {cityOptions.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCity !== 'all' && (
          <div
            className="inline-flex h-10 items-center rounded-xl border bg-background p-1 text-xs"
            role="group"
            aria-label={t.exploreCityMode}
          >
            <button
              type="button"
              onClick={() => onChangeCityMode('priority')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-colors',
                cityMode === 'priority'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.explorePriority}
            </button>
            <button
              type="button"
              onClick={() => onChangeCityMode('only')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-colors',
                cityMode === 'only'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.exploreOnly}
            </button>
          </div>
        )}

        <Select
          value={String(filters.minRating ?? 0)}
          onValueChange={(value) => onChange({ minRating: Number(value) })}
        >
          <SelectTrigger className="w-[135px]" aria-label={t.exploreMinRating}>
            <SelectValue placeholder={t.exploreAnyRating} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t.exploreAnyRating}</SelectItem>
            <SelectItem value="4">4.0+ ★</SelectItem>
            <SelectItem value="4.5">4.5+ ★</SelectItem>
            <SelectItem value="4.8">4.8+ ★</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort ?? 'trending'}
          onValueChange={(value) => onChange({ sort: value as ShopFilterParams['sort'] })}
        >
          <SelectTrigger className="w-[140px]" aria-label={t.exploreSort}>
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">{t.exploreSortTrending}</SelectItem>
            <SelectItem value="rating">{t.exploreSortTopRated}</SelectItem>
            <SelectItem value="reviews">{t.exploreSortMostReviewed}</SelectItem>
            {hasLocation && <SelectItem value="nearest">{t.exploreSortNearest}</SelectItem>}
          </SelectContent>
        </Select>

        {hasLocation ? (
          <Button variant="secondary" size="sm" onClick={onClearLocation} className="gap-1.5">
            <LocateFixed className="h-4 w-4 text-sky-500" />
            {t.exploreNearMe}
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onLocateMe}
            disabled={locating}
            className="gap-1.5"
          >
            <LocateFixed className="h-4 w-4" />
            {locating ? t.exploreDetecting : t.exploreDetectCity}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {displayTags.map((tag) => {
            const active = activeTags.includes(tag.slug);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleTag(tag.slug)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {tag.name}
              </button>
            );
          })}

          {selectedCity !== 'all' && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3 w-3" />
              {citySource === 'gps'
                ? `${t.exploreGpsCity}: ${selectedCity}`
                : citySource === 'profile'
                  ? `${t.exploreProfileCity}: ${selectedCity}`
                  : `${t.exploreCityLabel}: ${selectedCity}`}
              <button
                type="button"
                aria-label={t.exploreResetFilters}
                onClick={() => onSelectCity('all')}
                className="ml-0.5 rounded-full hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {(filters.q ||
          selectedCity !== 'all' ||
          (filters.minRating && filters.minRating > 0) ||
          activeTags.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            {t.exploreResetFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
