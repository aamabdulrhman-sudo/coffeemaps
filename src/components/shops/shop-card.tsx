'use client';

import Link from 'next/link';
import { Clock, Flame, Heart, MapPin, Star } from 'lucide-react';
import type { ShopItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ShareShopButton } from '@/components/shops/share-shop-button';
import { cn, formatRating } from '@/lib/utils';
import { useI18n } from '@/components/language-provider';

interface ShopCardProps {
  shop: ShopItem;
  isSelected?: boolean;
  onHover?: (shopId: string | null) => void;
  onToggleFavorite?: (shopId: string) => void;
}

export function ShopCard({ shop, isSelected, onHover, onToggleFavorite }: ShopCardProps) {
  const { t } = useI18n();
  const distanceLabel =
    shop.distanceKm !== null && shop.distanceKm !== undefined
      ? shop.distanceKm < 1
        ? `${Math.round(shop.distanceKm * 1000)} m ${t.exploreAway}`
        : `${shop.distanceKm.toFixed(1)} km ${t.exploreAway}`
      : null;
  const isTrending = shop.trendingScore >= 90;

  return (
    <article
      onMouseEnter={() => onHover?.(shop.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <Link href={`/shops/${shop.slug}`} className="block h-full w-full">
          <img
            src={shop.imageUrl}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {shop.isPriorityCity && (
            <Badge className="gap-1 bg-primary text-primary-foreground shadow-sm">
              <MapPin className="h-3 w-3" />
              {t.exploreYourCityBadge}
            </Badge>
          )}
          {isTrending && (
            <Badge className="gap-1 bg-amber-500/95 text-white backdrop-blur-sm">
              <Flame className="h-3 w-3" />
              {t.exploreTrendingBadge}
            </Badge>
          )}
          {distanceLabel && (
            <Badge variant="secondary" className="bg-black/65 text-white backdrop-blur-sm">
              {distanceLabel}
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <ShareShopButton slug={shop.slug} name={shop.name} variant="icon" />
          <button
            type="button"
            aria-label={shop.isFavorited ? t.shopRemoveFavorite : t.shopSaveFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(shop.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                shop.isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
              )}
            />
          </button>
        </div>
      </div>

      <Link href={`/shops/${shop.slug}`} className="block space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight group-hover:text-primary">
              {shop.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {shop.address}, {shop.city}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{formatRating(shop.averageRating)}</span>
            <span className="text-muted-foreground">({shop.reviewCount})</span>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {shop.description}
        </p>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{shop.openingHours}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {shop.tags.map((tag) => (
            <Badge key={tag.id} variant="accent" className="text-[11px]">
              {tag.name}
            </Badge>
          ))}
        </div>
      </Link>
    </article>
  );
}
