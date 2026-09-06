import { useState, type MouseEvent, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import type { Cat } from "../../types/cat";
import {
  formatCatCardMetadata,
  formatCatDisplayName,
} from "../../lib/catDisplay";
import { selectCatCardImage } from "../../lib/catPhoto";
import type { CatDetailLocationState } from "../../lib/resultsBrowsing";
import { CatTraitBadges } from "./CatTraitBadges";
import { FavoriteButton } from "./FavoriteButton";

interface CatCardProps {
  cat: Cat;
  /** Distance from the searched ZIP, when shown in search results. */
  distanceMiles?: number;
  /** Query string (no leading "?") to carry search context onto the detail page, e.g. "zip=91350". */
  detailQuery?: string;
  /** Router location state for the detail page (distance + results browsing). */
  detailState?: CatDetailLocationState;
  /**
   * Primary (unmodified left-click) in-app navigation. Keeps a real `href` for
   * new-tab / modified clicks while letting Results stamp scroll/reveal state.
   */
  onPrimaryDetailNavigation?: (
    detailHref: string,
    detailState: CatDetailLocationState | undefined,
  ) => void;
  /**
   * Opt-in LCP hint for the first above-the-fold result image.
   * Default keeps lazy loading for Home, Favorites, and later result cards.
   */
  priorityImage?: boolean;
}

function isModifiedOrNonPrimaryClick(event: MouseEvent): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  );
}

export function CatCard({
  cat,
  distanceMiles,
  detailQuery,
  detailState,
  onPrimaryDetailNavigation,
  priorityImage = false,
}: CatCardProps) {
  const photo = cat.photos[0];
  const [imgCatId, setImgCatId] = useState(cat.id);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());

  // Reset image failure tracking when the card is reused for a different cat.
  if (imgCatId !== cat.id) {
    setImgCatId(cat.id);
    setFailedSrcs(new Set());
  }

  const image = selectCatCardImage(photo, failedSrcs);

  const detailHref = detailQuery
    ? `/cats/${encodeURIComponent(cat.id)}?${detailQuery}`
    : `/cats/${encodeURIComponent(cat.id)}`;

  const linkState: CatDetailLocationState | undefined =
    detailState ??
    (typeof distanceMiles === "number" ? { distanceMiles } : undefined);

  const metadata = formatCatCardMetadata(cat);
  const displayName = formatCatDisplayName(cat.name);

  function handleImgError(event: SyntheticEvent<HTMLImageElement>) {
    const failed =
      event.currentTarget.currentSrc || event.currentTarget.src || image?.src;
    if (!failed) return;
    setFailedSrcs((prev) => new Set(prev).add(failed));
  }

  function handleDetailClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!onPrimaryDetailNavigation) return;
    if (event.defaultPrevented || isModifiedOrNonPrimaryClick(event)) return;
    event.preventDefault();
    onPrimaryDetailNavigation(detailHref, linkState);
  }

  return (
    <div className="card group relative flex flex-col overflow-hidden rounded-[2rem] transition hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-12px_rgba(95,58,77,0.38)] has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-mauve-400">
      <FavoriteButton
        catId={cat.id}
        catName={displayName}
        className="absolute top-3 right-3 z-10"
      />
      <Link
        to={detailHref}
        state={linkState}
        onClick={handleDetailClick}
        className="flex flex-1 flex-col overflow-hidden rounded-[2rem] outline-none"
      >
        {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-blush-100">
          {image ? (
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              alt={`Photo of ${displayName}`}
              width={800}
              height={600}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading={priorityImage ? "eager" : "lazy"}
              fetchPriority={priorityImage ? "high" : undefined}
              decoding="async"
              onError={handleImgError}
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-4xl"
            >
              🐱
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
          <h3 className="break-words text-xl font-semibold text-mauve-700">
            {displayName}
          </h3>

          <p className="break-words text-sm text-mauve-500">{cat.breed}</p>

          {metadata ? (
            <p className="break-words text-sm text-mauve-400">{metadata}</p>
          ) : null}

          <CatTraitBadges traits={cat.traits} onlyTrue />

          {typeof distanceMiles === "number" && (
            <p className="text-sm font-semibold text-blush-600">
              <span aria-hidden="true">🌸</span> {distanceMiles.toFixed(1)} miles
              away
            </p>
          )}

          <p className="break-words text-sm font-medium text-mauve-600">
            {cat.organization.name}
          </p>

          <p className="mt-auto break-words pt-2 text-sm font-semibold text-mauve-500 transition group-hover:text-mauve-700">
            Meet {displayName}{" "}
            <span
              aria-hidden="true"
              className="inline-block transition group-hover:translate-x-0.5"
            >
              →
            </span>
          </p>
        </div>
      </Link>
    </div>
  );
}
