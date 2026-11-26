'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DashboardData, ShopDetail, ShopItem, TagItem } from '@/types';

export interface ShopFilterParams {
  q?: string;
  city?: string;
  priorityCity?: string;
  minRating?: number;
  tags?: string[];
  sort?: 'trending' | 'rating' | 'nearest' | 'reviews';
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

interface ShopsResponse {
  shops: ShopItem[];
  cities: string[];
  tags: TagItem[];
  detectedCity?: string | null;
  activePriorityCity?: string | null;
}

export function useShops(filters: ShopFilterParams) {
  return useQuery<ShopsResponse>({
    queryKey: ['shops', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.city && filters.city !== 'all') params.set('city', filters.city);
      if (filters.priorityCity && filters.priorityCity !== 'all') {
        params.set('priorityCity', filters.priorityCity);
      }
      if (filters.minRating && filters.minRating > 0) {
        params.set('minRating', String(filters.minRating));
      }
      if (filters.tags && filters.tags.length > 0) {
        params.set('tags', filters.tags.join(','));
      }
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.lat !== undefined && filters.lng !== undefined) {
        params.set('lat', String(filters.lat));
        params.set('lng', String(filters.lng));
      }
      if (filters.radiusKm) params.set('radiusKm', String(filters.radiusKm));

      const res = await fetch(`/api/shops?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load coffee shops');
      return res.json();
    },
  });
}

export function useShopDetail(idOrSlug: string) {
  return useQuery<{ shop: ShopDetail }>({
    queryKey: ['shop', idOrSlug],
    queryFn: async () => {
      const res = await fetch(`/api/shops/${idOrSlug}`);
      if (!res.ok) throw new Error('Failed to load coffee shop details');
      return res.json();
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to update favorite');
      }
      return data as { isFavorited: boolean; shopId: string };
    },
    onSuccess: (data) => {
      toast.success(data.isFavorited ? 'Saved to favorites' : 'Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useFavorites() {
  return useQuery<{ favorites: ShopItem[] }>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites');
      if (!res.ok) throw new Error('Failed to load favorites');
      return res.json();
    },
  });
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      return res.json();
    },
  });
}
