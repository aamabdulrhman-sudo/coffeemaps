'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from '@/components/states/loading-skeletons';
import type { ShopItem } from '@/types';

const DynamicCoffeeMap = dynamic(
  () => import('@/components/map/coffee-map').then((mod) => mod.CoffeeMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

interface MapWrapperProps {
  shops: ShopItem[];
  selectedShopId?: string | null;
  activePriorityCity?: string | null;
  onSelectShop?: (shopId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicCoffeeMap {...props} />;
}
