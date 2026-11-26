'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareShopButtonProps {
  slug: string;
  name: string;
  variant?: 'icon' | 'pill';
}

export function ShareShopButton({ slug, name, variant = 'pill' }: ShareShopButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/shops/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} on CoffeeMap`,
          text: `Check out ${name} on CoffeeMap!`,
          url,
        });
        return;
      } catch {
        // User cancelled or Web Share unsupported; fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Direct shop link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Link copied' : 'Share'}
    </Button>
  );
}
