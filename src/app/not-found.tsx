import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Coffee className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t find that coffee spot or page. Let&apos;s get you back on the map.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">Return to CoffeeMap</Link>
      </Button>
    </main>
  );
}
