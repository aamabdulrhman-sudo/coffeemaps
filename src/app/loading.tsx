import { ShopGridSkeleton } from '@/components/states/loading-skeletons';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ShopGridSkeleton count={6} />
    </div>
  );
}
