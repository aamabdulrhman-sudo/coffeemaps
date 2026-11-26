'use client';

import { ErrorState } from '@/components/states/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <ErrorState
        title="Unexpected error"
        message={error.message || 'Something went wrong while rendering CoffeeMap.'}
        onRetry={reset}
      />
    </div>
  );
}
