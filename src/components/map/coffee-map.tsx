'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap, Circle } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { ExternalLink, Layers, MapPin, Star } from 'lucide-react';
import type { ShopItem } from '@/types';
import { formatDistance, formatRating } from '@/lib/utils';

type MapStyle = 'google' | 'satellite' | 'osm';

interface CoffeeMapProps {
  shops: ShopItem[];
  selectedShopId?: string | null;
  activePriorityCity?: string | null;
  onSelectShop?: (shopId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

function createPriceOrRatingIcon(
  rating: number,
  isSelected: boolean,
  isPriorityCity: boolean,
  isTrending: boolean
) {
  const label = rating > 0 ? `★ ${rating.toFixed(1)}` : '★ New';
  const bg = isSelected
    ? 'bg-stone-900 text-white border-stone-900 scale-110 dark:bg-white dark:text-stone-900'
    : isPriorityCity
      ? 'bg-orange-600 text-white border-orange-700 ring-2 ring-orange-300/80'
      : isTrending
        ? 'bg-amber-600 text-white border-amber-700'
        : 'bg-white text-stone-900 border-stone-200 dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700';

  return L.divIcon({
    className: 'coffeemap-marker',
    html: `<div class="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-md transition-transform whitespace-nowrap ${bg}">${label}</div>`,
    iconSize: [58, 28],
    iconAnchor: [29, 14],
  });
}

const userLocationIcon = L.divIcon({
  className: 'coffeemap-user-location',
  html: `<div class="relative flex h-5 w-5 items-center justify-center"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span><span class="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-sky-600 shadow"></span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapController({
  shops,
  selectedShopId,
  activePriorityCity,
  userLocation,
}: {
  shops: ShopItem[];
  selectedShopId?: string | null;
  activePriorityCity?: string | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedShopId) {
      const target = shops.find((s) => s.id === selectedShopId);
      if (target) {
        map.flyTo([target.latitude, target.longitude], 14, { duration: 0.7 });
      }
    }
  }, [selectedShopId, shops, map]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 0.8 });
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (!userLocation && activePriorityCity) {
      const cityShop = shops.find(
        (s) => s.city.toLowerCase() === activePriorityCity.toLowerCase()
      );
      if (cityShop) {
        map.flyTo([cityShop.latitude, cityShop.longitude], 12, { duration: 0.8 });
      }
    }
  }, [activePriorityCity, userLocation, shops, map]);

  return null;
}

const TILE_LAYERS: Record<
  MapStyle,
  { label: string; url: string; attribution: string; subdomains?: string[] }
> = {
  google: {
    label: 'Google Map',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Satellite',
  },
  osm: {
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

export function CoffeeMap({
  shops,
  selectedShopId,
  activePriorityCity,
  onSelectShop,
  userLocation,
}: CoffeeMapProps) {
  const { resolvedTheme } = useTheme();
  const [mapStyle, setMapStyle] = useState<MapStyle>('google');

  const center = useMemo<[number, number]>(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (activePriorityCity) {
      const cityShop = shops.find(
        (s) => s.city.toLowerCase() === activePriorityCity.toLowerCase()
      );
      if (cityShop) return [cityShop.latitude, cityShop.longitude];
    }
    if (shops.length > 0) return [shops[0].latitude, shops[0].longitude];
    return [24.4672, 39.6111];
  }, [shops, userLocation, activePriorityCity]);

  const activeLayer = TILE_LAYERS[mapStyle];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {/* Map Style Switcher */}
      <div className="absolute right-3 top-3 z-[400] flex items-center gap-1 rounded-xl border bg-background/95 p-1 shadow-md backdrop-blur">
        <Layers className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
        {(Object.keys(TILE_LAYERS) as MapStyle[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setMapStyle(key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              mapStyle === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {TILE_LAYERS[key].label}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={shops.length > 1 && !userLocation && !activePriorityCity ? 3 : 12}
        scrollWheelZoom
        className={`h-full w-full rounded-2xl ${
          resolvedTheme === 'dark' && mapStyle !== 'satellite' ? 'coffeemap-dark-tiles' : ''
        }`}
      >
        <TileLayer
          key={mapStyle}
          attribution={activeLayer.attribution}
          url={activeLayer.url}
          subdomains={activeLayer.subdomains ?? ['a', 'b', 'c']}
        />

        <MapController
          shops={shops}
          selectedShopId={selectedShopId}
          activePriorityCity={activePriorityCity}
          userLocation={userLocation}
        />

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={2500}
              pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.12 }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
              <Popup>
                <div className="p-2 text-xs font-semibold">Your Current Location</div>
              </Popup>
            </Marker>
          </>
        )}

        {shops.map((shop) => {
          const isSelected = shop.id === selectedShopId;
          const isTrending = shop.trendingScore >= 90;
          const distanceLabel = formatDistance(shop.distanceKm);

          return (
            <Marker
              key={shop.id}
              position={[shop.latitude, shop.longitude]}
              icon={createPriceOrRatingIcon(
                shop.averageRating,
                isSelected,
                Boolean(shop.isPriorityCity),
                isTrending
              )}
              eventHandlers={{
                click: () => onSelectShop?.(shop.id),
              }}
            >
              <Popup minWidth={240} maxWidth={260}>
                <div className="w-60 overflow-hidden bg-card text-card-foreground">
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="h-28 w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-1 text-sm font-semibold">{shop.name}</h4>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {formatRating(shop.averageRating)}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {shop.city}
                        {distanceLabel ? ` • ${distanceLabel}` : ''}
                      </span>
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/shops/${shop.slug}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View details →
                      </Link>
                      <a
                        href={shop.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
