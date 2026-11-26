'use client';

import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { useI18n } from '@/components/language-provider';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-card/50 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Coffee className="h-4 w-4 text-primary" />
          <span>CoffeeMap</span>
          <span className="text-muted-foreground">• {t.communitySubtitle}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-foreground">
            {t.navExplore}
          </Link>
          <Link href="/favorites" className="hover:text-foreground">
            {t.navFavorites}
          </Link>
          <Link href="/community" className="hover:text-foreground">
            {t.navCommunity}
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            {t.navDashboard}
          </Link>
          <Link href="/profile" className="hover:text-foreground">
            {t.navProfile}
          </Link>
        </div>
      </div>
    </footer>
  );
}
