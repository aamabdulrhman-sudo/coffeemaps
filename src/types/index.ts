export interface TagItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  caption?: string | null;
  userId: string;
  shopId: string;
  reviewId?: string | null;
  createdAt: string;
}

export interface UserBadgeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: string;
}

export interface ReviewAuthor {
  id: string;
  name: string | null;
  image: string | null;
  badges?: UserBadgeItem[];
}

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  userId: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewAuthor;
  photos: PhotoItem[];
}

export interface ShopItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  openingHours: string;
  googleMapsUrl: string;
  averageRating: number;
  reviewCount: number;
  favoriteCount: number;
  trendingScore: number;
  aiSummary?: string | null;
  aiSummaryUpdatedAt?: string | null;
  tags: TagItem[];
  isFavorited?: boolean;
  isPriorityCity?: boolean;
  distanceKm?: number | null;
}

export interface ShopDetail extends ShopItem {
  reviews: ReviewItem[];
  photos: PhotoItem[];
}

export interface DashboardData {
  stats: {
    savedCount: number;
    reviewCount: number;
    photoCount: number;
    averageRatingGiven: number;
    citiesVisited: number;
  };
  badges: UserBadgeItem[];
  recentReviews: Array<
    ReviewItem & {
      shop: {
        id: string;
        name: string;
        slug: string;
        city: string;
        imageUrl: string;
      };
    }
  >;
  favorites: ShopItem[];
  ratingDistribution: Array<{ rating: number; count: number }>;
}
