import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShopCard } from '@/components/shops/shop-card';
import type { ShopItem } from '@/types';

const mockShop: ShopItem = {
  id: 'shop_1',
  name: 'Elixir Bunn Coffee Roasters',
  slug: 'elixir-bunn-riyadh',
  description: 'Specialty roastery with fast WiFi and pour-over bar.',
  address: 'Tahlia Street',
  city: 'Riyadh',
  country: 'Saudi Arabia',
  latitude: 24.7,
  longitude: 46.68,
  imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
  openingHours: 'Daily: 7:00 AM - 11:00 PM',
  googleMapsUrl: 'https://maps.google.com/?q=24.7,46.68',
  averageRating: 4.9,
  reviewCount: 24,
  favoriteCount: 15,
  trendingScore: 96,
  tags: [
    { id: 't1', name: 'WiFi', slug: 'wifi', icon: 'wifi' },
    { id: 't2', name: 'Specialty Coffee', slug: 'specialty-coffee', icon: 'coffee' },
  ],
  isFavorited: false,
  isPriorityCity: true,
  distanceKm: 1.2,
};

describe('ShopCard', () => {
  it('renders shop name, rating, city, priority badge, distance, and tags', () => {
    render(<ShopCard shop={mockShop} />);

    expect(screen.getByText('Elixir Bunn Coffee Roasters')).toBeInTheDocument();
    expect(screen.getByText('Your City')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText(/Tahlia Street, Riyadh/)).toBeInTheDocument();
    expect(screen.getByText('1.2 km away')).toBeInTheDocument();
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Specialty Coffee')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when heart button is clicked', () => {
    const onToggleFavorite = vi.fn();
    render(<ShopCard shop={mockShop} onToggleFavorite={onToggleFavorite} />);

    const favButton = screen.getByRole('button', {
      name: /Save Elixir Bunn Coffee Roasters to favorites/i,
    });
    fireEvent.click(favButton);
    expect(onToggleFavorite).toHaveBeenCalledWith('shop_1');
  });
});
