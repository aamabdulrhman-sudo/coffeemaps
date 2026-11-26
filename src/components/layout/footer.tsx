import Link from 'next/link';
import { Coffee } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card/50 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Coffee className="h-4 w-4 text-primary" />
          <span>CoffeeMap</span>
          <span className="text-muted-foreground">• Discover great specialty coffee</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-foreground">
            Explore
          </Link>
          <Link href="/favorites" className="hover:text-foreground">
            Favorites
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/profile" className="hover:text-foreground">
            Profile
          </Link>
        </div>
      </div>
    </footer>
  );
}
