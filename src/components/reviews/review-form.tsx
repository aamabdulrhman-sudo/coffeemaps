'use client';

import { useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  shopId: string;
  initialData?: {
    id: string;
    rating: number;
    title?: string | null;
    comment: string;
  };
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ shopId, initialData, onSuccess, onCancel }: ReviewFormProps) {
  const isEdit = Boolean(initialData);
  const [rating, setRating] = useState(initialData?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [comment, setComment] = useState(initialData?.comment ?? '');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 5 - photoUrls.length)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        uploaded.push(data.url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (comment.trim().length < 5) {
      setError('Please write at least 5 characters for your review.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isEdit ? `/api/reviews/${initialData!.id}` : '/api/reviews';
      const method = isEdit ? 'PATCH' : 'POST';
      const payload = isEdit
        ? { rating, title: title.trim() || null, comment: comment.trim() }
        : { shopId, rating, title: title.trim() || null, comment: comment.trim(), photoUrls };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save review');

      toast.success(isEdit ? 'Review updated' : 'Review published!');
      if (!isEdit) {
        setTitle('');
        setComment('');
        setPhotoUrls([]);
        setRating(5);
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit review';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="space-y-1.5">
        <Label>Your Rating</Label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} stars`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="rounded-md p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-6 w-6',
                    active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                  )}
                />
              </button>
            );
          })}
          <span className="ml-2 text-sm font-medium text-muted-foreground">{rating} / 5</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-title">Headline (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Silky cortado and reliable WiFi"
          maxLength={120}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Your Review</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about the espresso, seating, WiFi speed, and atmosphere..."
          required
        />
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label>Photos (optional, up to 5)</Label>
          <div className="flex flex-wrap items-center gap-3">
            {photoUrls.map((url) => (
              <div key={url} className="relative h-16 w-16 overflow-hidden rounded-xl border">
                <img src={url} alt="Uploaded preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls((prev) => prev.filter((item) => item !== url))}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photoUrls.length < 5 && (
              <label className="flex h-16 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Add photo'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? 'Saving...' : isEdit ? 'Update review' : 'Post review'}
        </Button>
      </div>
    </form>
  );
}
