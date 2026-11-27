export interface TagItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface LoyaltyProgramItem {
  id: string;
  shopId: string;
  stampsGoal: number;
  reward: string;
  active: boolean;
}

export interface LoyaltyBalanceItem {
  id: string;
  cardId: string;
  programId: string;
  stamps: number;
  redemptions: number;
  completedAt?: string | null;
  lastRedeemedAt?: string | null;
  lastStampedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  program: LoyaltyProgramItem & {
    shop: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string;
      city: string;
    };
  };
}

export interface LoyaltyWalletData {
  user: { id: string; name: string | null; image: string | null };
  card: {
    id: string;
    code: string;
    createdAt: string;
    balances: LoyaltyBalanceItem[];
  };
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
  loyaltyProgram?: LoyaltyProgramItem | null;
  loyaltyBalance?: LoyaltyBalanceItem | null;
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
    followers: number;
    following: number;
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
  loyaltyWallet: LoyaltyWalletData;
}

export interface CommunityMember {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  isFollowing: boolean;
  isSelf: boolean;
  _count: {
    reviews: number;
    followers: number;
    following: number;
    photos: number;
  };
}

export interface AdBannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  shopId?: string | null;
  active: boolean;
  priority: number;
  clicks: number;
  shop?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    imageUrl: string;
    averageRating: number;
    reviewCount: number;
  } | null;
}

export interface PublicUserProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  isFollowing?: boolean;
  badges: UserBadgeItem[];
  reviews: Array<
    ReviewItem & {
      shop: {
        id: string;
        name: string;
        slug: string;
        city: string;
        imageUrl: string;
        averageRating: number;
      };
    }
  >;
  _count: {
    reviews: number;
    followers: number;
    following: number;
    photos: number;
  };
}
