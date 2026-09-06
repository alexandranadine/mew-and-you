/**
 * Reserves approximate Cat Detail vertical structure while data loads so the
 * site footer stays below the fold (avoids CLS when real content replaces this).
 */
export function CatDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-11 w-36 animate-pulse rounded-full bg-blush-100" />

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-blush-100 shadow-[var(--shadow-cozy)]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-8 w-3/5 max-w-xs animate-pulse rounded-full bg-blush-100 sm:h-9" />
              <div className="h-5 w-2/5 max-w-[12rem] animate-pulse rounded-full bg-blush-100" />
            </div>
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-blush-100" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-0 rounded-2xl bg-blush-50 px-1 py-2.5 sm:px-2 sm:py-3"
              >
                <div className="mx-auto h-3 w-10 animate-pulse rounded-full bg-blush-100" />
                <div className="mx-auto mt-2 h-4 w-14 animate-pulse rounded-full bg-blush-100" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-blush-100" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-blush-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-blush-100" />
          </div>

          <div className="mt-6 h-6 w-40 animate-pulse rounded-full bg-blush-100" />
          <div className="mt-3 space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded-full bg-blush-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-blush-100" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-blush-100" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-blush-100" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-blush-100" />
          </div>

          <div className="mt-8">
            <div className="h-6 w-48 animate-pulse rounded-full bg-blush-100" />
            <div className="mt-3 h-12 w-full animate-pulse rounded-full bg-blush-100" />
            <div className="mt-2 h-4 w-3/4 max-w-sm animate-pulse rounded-full bg-blush-100" />
          </div>

          <div className="mt-8 border-t border-blush-100 pt-5">
            <div className="h-3 w-32 animate-pulse rounded-full bg-blush-100" />
            <div className="mt-3 h-5 w-44 animate-pulse rounded-full bg-blush-100" />
            <div className="mt-2 h-4 w-36 animate-pulse rounded-full bg-blush-100" />
            <div className="mt-1.5 h-4 w-28 animate-pulse rounded-full bg-blush-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
