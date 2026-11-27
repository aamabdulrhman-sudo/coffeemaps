'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MapPin, Megaphone, Star } from 'lucide-react';
import { useAdBanners } from '@/hooks/use-coffeemap';
import { cn, formatRating } from '@/lib/utils';

export function AdBanners() {
  const router = useRouter();
  const { data } = useAdBanners();
  const banners = data?.banners ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  const banner = banners[Math.min(index, banners.length - 1)];
  const image = banner.imageUrl || banner.shop?.imageUrl;
  const href = banner.shop
    ? `/shops/${banner.shop.slug}`
    : banner.linkUrl && banner.linkUrl.startsWith('/')
      ? banner.linkUrl
      : banner.linkUrl || '/';

  function trackClick() {
    if (!banner.shop) return;
    // fire-and-forget click tracking, then navigate
    fetch(`/api/ads/${banner.id}/click`, { method: 'POST', keepalive: true }).catch(() => {});
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured coffee shops"
    >
      {/* Clickable banner → shop page */}
      <button
        type="button"
        onClick={() => {
          trackClick();
          if (href.startsWith('/')) {
            router.push(href);
          } else {
            window.open(href, '_blank', 'noopener');
          }
        }}
        className="group relative block h-44 w-full text-left sm:h-48 lg:h-52"
      >
        {image ? (
          <img
            src={image}
            alt={banner.shop?.name ?? banner.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-coffee-100 to-amber-100 dark:from-coffee-950 dark:to-amber-950" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Ad badge */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          <Megaphone className="h-3 w-3" />
          Ad
        </span>

        {/* Shop name + info overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight sm:text-xl">
            {banner.shop?.name ?? banner.title}
          </h3>
          {banner.shop ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/85">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {banner.shop.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRating(banner.shop.averageRating)} ({banner.shop.reviewCount})
              </span>
            </div>
          ) : (
            banner.subtitle && (
              <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{banner.subtitle}</p>
            )
          )}
        </div>
      </button>

      {/* Carousel controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + banners.length) % banners.length);
            }}
            className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-md transition hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % banners.length);
            }}
            className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur-md transition hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-3 z-10 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
