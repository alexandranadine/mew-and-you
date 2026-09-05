import { useState } from "react";
import { Link } from "react-router-dom";
import type { Cat } from "../../types/cat";
import {
  formatCatCardMetadata,
  formatCatDisplayName,
} from "../../lib/catDisplay";
import { CatTraitBadges } from "./CatTraitBadges";
import { FavoriteButton } from "./FavoriteButton";

interface CatCardProps {
  cat: Cat;
  /** Distance from the searched ZIP, when shown in search results. */
  distanceMiles?: number;
  /** Query string (no leading "?") to carry search context onto the detail page, e.g. "zip=91350". */
  detailQuery?: string;
}

export function CatCard({ cat, distanceMiles, detailQuery }: CatCardProps) {
  const photo = cat.photos[0];
  const preferredSrc = photo?.thumbnailUrl ?? photo?.url;
  const [imgCatId, setImgCatId] = useState(cat.id);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());

  // Reset image failure tracking when the card is reused for a different cat.
  if (imgCatId !== cat.id) {
    setImgCatId(cat.id);
    setFailedSrcs(new Set());
  }

  const imgSrc =
    preferredSrc && !failedSrcs.has(preferredSrc)
      ? preferredSrc
      : photo?.url &&
          photo.url !== preferredSrc &&
          !failedSrcs.has(photo.url)
        ? photo.url
        : undefined;

  const detailHref = detailQuery
    ? `/cats/${encodeURIComponent(cat.id)}?${detailQuery}`
    : `/cats/${encodeURIComponent(cat.id)}`;

  const metadata = formatCatCardMetadata(cat);
  const displayName = formatCatDisplayName(cat.name);

  function handleImgError() {
    if (!imgSrc) return;
    setFailedSrcs((prev) => new Set(prev).add(imgSrc));
  }

  return (
    <div className="card group relative flex flex-col overflow-hidden rounded-[2rem] transition hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-12px_rgba(95,58,77,0.38)]">
      <FavoriteButton
        catId={cat.id}
        catName={displayName}
        className="absolute top-3 right-3 z-10"
      />
      <Link
        to={detailHref}
        state={typeof distanceMiles === "number" ? { distanceMiles } : undefined}
        className="focus-ring flex flex-1 flex-col overflow-hidden rounded-[2rem]"
      >
        {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-blush-100">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={`Photo of ${displayName}`}
              width={800}
              height={600}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
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

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-xl font-semibold text-mauve-700">{displayName}</h3>

          <p className="text-sm text-mauve-500">{cat.breed}</p>

          {metadata ? (
            <p className="text-sm text-mauve-400">{metadata}</p>
          ) : null}

          <CatTraitBadges traits={cat.traits} onlyTrue />

          {typeof distanceMiles === "number" && (
            <p className="text-sm font-semibold text-blush-600">
              <span aria-hidden="true">🌸</span> {distanceMiles.toFixed(1)} miles
              away
            </p>
          )}

          <p className="text-sm font-medium text-mauve-600">
            {cat.organization.name}
          </p>

          <p className="mt-auto pt-2 text-sm font-semibold text-mauve-500 transition group-hover:text-mauve-700">
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
