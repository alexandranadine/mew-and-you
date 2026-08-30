export function CatCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] w-full animate-pulse bg-blush-100" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-blush-100" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-blush-100" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-blush-100" />
      </div>
    </div>
  );
}
