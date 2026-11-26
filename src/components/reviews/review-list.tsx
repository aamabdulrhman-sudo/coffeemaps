'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ReviewItem } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BadgePill } from '@/components/badges/badge-pill';
import { ReviewForm } from '@/components/reviews/review-form';
import { EmptyState } from '@/components/states/empty-state';
import { useI18n } from '@/components/language-provider';

interface ReviewListProps {
  reviews: ReviewItem[];
  shopId: string;
  currentUserId?: string;
  onChanged: () => void;
}

export function ReviewList({ reviews, shopId, currentUserId, onChanged }: ReviewListProps) {
  const { t, formatDate } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.adminFailed);
      toast.success(t.reviewDeleted);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.adminFailed);
    } finally {
      setDeletingId(null);
    }
  }

  if (reviews.length === 0) {
    return <EmptyState title={t.reviewNoReviews} description={t.reviewNoReviewsDesc} />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwner = currentUserId === review.userId;
        const isEditing = editingId === review.id;

        if (isEditing) {
          return (
            <ReviewForm
              key={review.id}
              shopId={shopId}
              initialData={{
                id: review.id,
                rating: review.rating,
                title: review.title,
                comment: review.comment,
              }}
              onSuccess={() => {
                setEditingId(null);
                onChanged();
              }}
              onCancel={() => setEditingId(null)}
            />
          );
        }

        const initials =
          review.user.name
            ?.split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? 'U';

        return (
          <div key={review.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={review.user.image ?? undefined} alt={review.user.name ?? ''} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/users/${review.user.id}`}
                      className="text-sm font-semibold hover:text-primary hover:underline"
                    >
                      {review.user.name ?? t.profileCoffeeExplorer}
                    </Link>
                    {review.user.badges?.slice(0, 2).map((badge) => (
                      <BadgePill key={badge.id} name={badge.name} icon={badge.icon} compact />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-lg bg-secondary px-2 py-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Edit review"
                      onClick={() => setEditingId(review.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label="Delete review"
                      disabled={deletingId === review.id}
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {review.title && <h4 className="mt-3 text-sm font-semibold">{review.title}</h4>}
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>

            {review.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.caption ?? 'Review photo'}
                    className="h-24 w-24 rounded-xl border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
