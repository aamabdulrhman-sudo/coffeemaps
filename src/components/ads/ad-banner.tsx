'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Megaphone, Star } from 'lucide-react';
import { useAdBanners } from '@/hooks/use-coffeemap';
import { cn, formatRating } from '@/lib/utils';

export function AdBanners() {
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

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured coffee shops"
    >
      <div className="flex items-stretch">
        {/* Featured shop image */}
        {banner.shop && (
          <Link
            href={`/shops/${banner.shop.slug}`}
            className="relative hidden w-1/3 shrink-0 sm:block"
          >
            <img
              src={banner.shop.imageUrl}
              alt={banner.shop.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="line-clamp-1 text-sm font-bold">{banner.shop.name}</p>
              <p className="flex items-center gap-1 text-xs text-white/90">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRating(banner.shop.averageRating)} ({banner.shop.reviewCount})
              </p>
            </div>
          </Link>
        )}

        {/* Ad copy */}
        <div className="relative flex flex-1 flex-col justify-center gap-1 p-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Megaphone className="h-3 w-3" />
            Ad
          </span>
          <Link
            href={banner.linkUrl || (banner.shop ? `/shops/${banner.shop.slug}` : '/community')}
            className="group"
          >
            <h3 className="line-clamp-1 text-base font-bold tracking-tight group-hover:text-primary sm:text-lg">
              {banner.title}
            </h3>
            {banner.subtitle && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                {banner.subtitle}
              </p>
            )}
          </Link>
        </div>
      </div>

      {/* Carousel controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            onClick={() => setIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition hover:bg-black/60 focus:opacity-100 group-hover:opacity-100 md:opacity-60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={() => setIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white opacity-0 transition hover:bg-black/60 focus:opacity-100 md:opacity-60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-3 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/40'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
