import { useState } from "react";
import { Link } from "react-router-dom";
import type { Cat } from "../../types/cat";
import { CatTraitBadges } from "./CatTraitBadges";

interface CatCardProps {
  cat: Cat;
  /** Distance from the searched ZIP, when shown in search results. */
  distanceMiles?: number;
  /** Query string (no leading "?") to carry search context onto the detail page, e.g. "zip=91350". */
  detailQuery?: string;
}

export function CatCard({ cat, distanceMiles, detailQuery }: CatCardProps) {
  const photo = cat.photos[0];
  const [imgFailed, setImgFailed] = useState(false);
  const detailHref = detailQuery
    ? `/cats/${encodeURIComponent(cat.id)}?${detailQuery}`
    : `/cats/${encodeURIComponent(cat.id)}`;

  return (
    <Link
      to={detailHref}
      state={typeof distanceMiles === "number" ? { distanceMiles } : undefined}
      className="card focus-ring group flex flex-col overflow-hidden rounded-[2rem] transition hover:-translate-y-1.5 hover:shadow-[0_22px_44px_-12px_rgba(95,58,77,0.38)]"
    >
      {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-blush-100">
        {photo && !imgFailed ? (
          <img
            src={photo.thumbnailUrl ?? photo.url}
            alt={`Photo of ${cat.name}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
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
        <h3 className="text-xl font-semibold text-mauve-700">{cat.name}</h3>

        <p className="text-sm text-mauve-500">{cat.breed}</p>

        <p className="text-sm text-mauve-400">
          {cat.age} &middot; {sexLabel(cat.sex)} &middot; {sizeLabel(cat.size)}
        </p>

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
          Meet {cat.name}{" "}
          <span
            aria-hidden="true"
            className="inline-block transition group-hover:translate-x-0.5"
          >
            →
          </span>
        </p>
      </div>
    </Link>
  );
}

function sexLabel(sex: Cat["sex"]): string {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return "Unknown sex";
}

function sizeLabel(size: Cat["size"]): string {
  return size.charAt(0).toUpperCase() + size.slice(1);
}
