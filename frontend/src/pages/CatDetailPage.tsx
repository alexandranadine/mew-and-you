import { useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { CatTraitBadges } from "../components/cats/CatTraitBadges";
import { FavoriteButton } from "../components/cats/FavoriteButton";
import { SearchStateCard } from "../components/cats/SearchStateCard";
import { PageMeta } from "../components/seo/PageMeta";
import { useCatDetail } from "../hooks/useCatDetail";
import {
  formatCatDisplayName,
  getCatDetailAttributes,
  hasRealDescription,
  isKennelIdName,
  missingBioMessage,
} from "../lib/catDisplay";
import {
  backHrefFromDetailSearchParams,
  type CatDetailLocationState,
  type ResultsLocationState,
} from "../lib/resultsBrowsing";
import {
  catDetailLoadingSeo,
  catDetailMissingSeo,
  catDetailSeo,
  catJsonLd,
  getSiteOrigin,
  toAbsoluteUrl,
} from "../config/seo";
import type { Cat } from "../types/cat";

export function CatDetailPage() {
  const { catId } = useParams<{ catId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { data: cat, isPending, isError, error, refetch, isFetching } =
    useCatDetail(catId);
  const [galleryCatId, setGalleryCatId] = useState(catId);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Set<string>>(
    () => new Set(),
  );

  // Direct URL / in-app navigation between cats must reset gallery state so
  // a prior selection or failed-image set doesn't carry over.
  if (galleryCatId !== catId) {
    setGalleryCatId(catId);
    setSelectedPhotoIndex(0);
    setFailedPhotoUrls(new Set());
  }

  function markPhotoFailed(url: string) {
    setFailedPhotoUrls((prev) => new Set(prev).add(url));
  }

  // Distance is only known in the context of a search (passed along when
  // navigating from a results card); there's no way to recompute it here
  // without re-geocoding, so it's simply omitted otherwise.
  const detailState = location.state as CatDetailLocationState | null;
  const distanceMiles = detailState?.distanceMiles;
  const { href: backHref, hasResultsContext } =
    backHrefFromDetailSearchParams(searchParams);
  const backLabel = hasResultsContext
    ? "← Back to results"
    : "← Back to search";
  const backState: ResultsLocationState | undefined =
    detailState?.resultsBrowsing
      ? { resultsBrowsing: detailState.resultsBrowsing }
      : undefined;

  if (!catId) {
    const meta = catDetailMissingSeo(undefined);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
          robots={meta.robots}
        />
        <SearchStateCard
          headingLevel={1}
          icon="🙀"
          title="We couldn't find that cat"
          message="This listing may have been adopted already, or the link might be incorrect."
        >
          <Link to="/" className="btn-primary">
            Back to search
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  if (isPending) {
    const meta = catDetailLoadingSeo(catId);
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
        />
        <SearchStateCard
          headingLevel={1}
          icon="🐾"
          title="Fetching this cat's profile…"
          message="One moment."
        />
      </div>
    );
  }

  if (isError) {
    const meta = catDetailLoadingSeo(catId);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
        />
        <SearchStateCard
          headingLevel={1}
          icon="⚠️"
          title="Something went wrong"
          message={
            error instanceof Error
              ? error.message
              : "We couldn't load this cat's profile. Please try again."
          }
        >
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-primary"
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
          <Link to={backHref} state={backState} className="btn-secondary">
            {hasResultsContext ? "Back to results" : "Back to search"}
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  if (!cat) {
    const meta = catDetailMissingSeo(catId);
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <PageMeta
          title={meta.title}
          description={meta.description}
          canonicalPath={meta.canonicalPath}
          robots={meta.robots}
        />
        <SearchStateCard
          headingLevel={1}
          icon="🙀"
          title="We couldn't find that cat"
          message="This listing may have been adopted already, or the link might be incorrect."
        >
          <Link to={backHref} state={backState} className="btn-primary">
            {hasResultsContext ? "Back to results" : "Back to search"}
          </Link>
        </SearchStateCard>
      </div>
    );
  }

  const mainPhoto = cat.photos[selectedPhotoIndex] ?? cat.photos[0];
  const mainPhotoFailed = mainPhoto ? failedPhotoUrls.has(mainPhoto.url) : true;
  const hasBio = hasRealDescription(cat.description);
  const detailAttributes = getCatDetailAttributes(cat);
  const displayName = formatCatDisplayName(cat.name);
  const kennelIdName = isKennelIdName(cat.name);
  const adoptionCta = adoptionCtaCopy(cat);
  const showOrganizationWebsite = shouldShowOrganizationWebsite(cat);

  const meta = catDetailSeo(cat);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
        image={meta.image}
        imageAlt={meta.imageAlt}
        jsonLd={catJsonLd(cat, toAbsoluteUrl(meta.canonicalPath, getSiteOrigin()))}
      />
      <Link
        to={backHref}
        state={backState}
        className="focus-ring inline-flex min-h-11 items-center py-1 text-sm font-medium text-mauve-500 hover:text-mauve-700"
      >
        {backLabel}
      </Link>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="min-w-0">
          {/* Fixed aspect ratio reserves space up front so the layout doesn't shift once the image loads. */}
          <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-blush-100 shadow-[var(--shadow-cozy)]">
            {mainPhoto && !mainPhotoFailed ? (
              <img
                src={mainPhoto.url}
                alt={`Photo of ${displayName}`}
                width={800}
                height={600}
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                onError={() => markPhotoFailed(mainPhoto.url)}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center text-6xl"
              >
                🐱
              </div>
            )}
          </div>

          {cat.photos.length > 1 && (
            <div
              className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto overscroll-x-contain px-1 pb-1 sm:gap-3"
              role="group"
              aria-label={`${displayName}'s photos`}
            >
              {cat.photos.map((photo, index) => {
                const thumbFailed = failedPhotoUrls.has(
                  photo.thumbnailUrl ?? photo.url,
                );
                const isSelected = index === selectedPhotoIndex;
                return (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    aria-label={`View photo ${index + 1} of ${cat.photos.length}`}
                    aria-current={isSelected ? true : undefined}
                    className={`focus-ring h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-16 sm:w-20 ${
                      isSelected
                        ? "border-mauve-500"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {thumbFailed ? (
                      <div
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center bg-blush-100 text-xl"
                      >
                        🐱
                      </div>
                    ) : (
                      <img
                        src={photo.thumbnailUrl ?? photo.url}
                        alt=""
                        width={88}
                        height={72}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={() =>
                          markPhotoFailed(photo.thumbnailUrl ?? photo.url)
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold text-mauve-700 sm:text-3xl">
                {displayName}
              </h1>
              {kennelIdName ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-mauve-400">
                  Shelter ID
                </p>
              ) : null}
              <p className="mt-1 break-words text-base text-mauve-500 sm:text-lg">
                {cat.breed}
              </p>
              {typeof distanceMiles === "number" ? (
                <p className="mt-1 text-sm text-mauve-400">
                  {distanceMiles.toFixed(1)} mi away
                </p>
              ) : null}
            </div>
            <FavoriteButton
              catId={cat.id}
              catName={displayName}
              size="md"
              className="shrink-0"
            />
          </div>

          {detailAttributes.length > 0 ? (
            <dl
              className={`mt-4 text-center ${attributeListClass(detailAttributes.length)}`}
            >
              {detailAttributes.map((attr) => (
                <div
                  key={attr.key}
                  className={attributeTileClass(detailAttributes.length)}
                >
                  <dt className="text-xs uppercase tracking-wide text-mauve-400">
                    {attr.label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium text-mauve-700 sm:text-base">
                    {attr.value}
                    {attr.subvalue ? (
                      <span className="block text-xs font-normal text-mauve-400">
                        {attr.subvalue}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-5 empty:mt-0 empty:hidden">
            <CatTraitBadges traits={cat.traits} />
          </div>

          <h2 className="mt-6 break-words font-display text-lg font-semibold text-mauve-700">
            About {displayName}
          </h2>
          {hasBio ? (
            <p className="mt-2 max-w-prose leading-relaxed text-pretty text-mauve-600">
              {cat.description.trim()}
            </p>
          ) : (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-pretty text-mauve-400">
              {missingBioMessage(cat.name)}
            </p>
          )}

          <section className="mt-8">
            <h2 className="break-words font-display text-lg font-semibold text-mauve-700">
              Interested in {displayName}?
            </h2>
            <a
              href={cat.adoptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 min-h-12 w-full flex-wrap justify-center gap-x-2 gap-y-1 px-5 py-3.5 text-center text-base leading-snug sm:px-8 sm:py-4"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0 -rotate-32 text-cream-50"
                fill="currentColor"
              >
                <circle cx="12" cy="15" r="5" />
                <circle cx="5" cy="8" r="2.4" />
                <circle cx="10" cy="4" r="2.4" />
                <circle cx="15" cy="4" r="2.4" />
                <circle cx="19" cy="8" r="2.4" />
              </svg>
              <span className="min-w-0 break-words">{adoptionCta.label}</span>
              <span aria-hidden="true" className="shrink-0">
                ↗
              </span>
              {adoptionCta.mentionsNewTab ? null : (
                <span className="sr-only"> (opens in a new tab)</span>
              )}
            </a>
            <p className="mt-2 max-w-prose text-sm leading-snug text-pretty text-mauve-400">
              {adoptionCta.helper}
            </p>
          </section>

          <section className="mt-8 border-t border-blush-100 pt-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-mauve-400">
              Shelter information
            </h2>
            <p className="mt-2 break-words font-medium text-mauve-600">
              {cat.organization.name}
            </p>
            <p className="mt-0.5 break-words text-sm text-mauve-400">
              {cat.organization.city}, {cat.organization.state}{" "}
              {cat.organization.zip}
            </p>
            {cat.organization.phone ? (
              <p className="mt-0.5 break-words text-sm text-mauve-400">
                {cat.organization.phone}
              </p>
            ) : null}
            {showOrganizationWebsite && cat.organization.website ? (
              <a
                href={cat.organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-1 inline-flex min-h-11 items-center text-sm text-mauve-500 underline-offset-2 hover:underline"
              >
                Visit website
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function attributeListClass(count: number): string {
  if (count >= 3) return "grid grid-cols-3 gap-1.5 sm:gap-3";
  return "flex flex-wrap gap-2 sm:gap-3";
}

function attributeTileClass(count: number): string {
  if (count >= 3) {
    return "min-w-0 rounded-2xl bg-blush-50 px-1 py-2.5 sm:px-2 sm:py-3";
  }
  return "w-full min-w-0 max-w-none flex-none rounded-2xl bg-blush-50 px-3 py-3 sm:w-max sm:min-w-[7.5rem] sm:max-w-[11rem]";
}

function adoptionCtaCopy(cat: Cat): {
  label: string;
  helper: string;
  mentionsNewTab: boolean;
} {
  const organizationName = cat.organization.name;
  switch (cat.adoptionUrlSource) {
    case "organizationAdoption":
      return {
        label: `Adopt through ${organizationName}`,
        helper: `We couldn't grab a direct link for this cat, but you can visit ${organizationName}'s adoption page to learn more.`,
        mentionsNewTab: false,
      };
    case "organizationWebsite":
      return {
        label: `Visit ${organizationName}`,
        helper: `We couldn't grab a direct link for this cat, but you can visit ${organizationName} to learn more.`,
        mentionsNewTab: false,
      };
    case "fallback":
      return {
        label: "View adoption listing",
        helper:
          "We couldn't grab a direct listing for this cat. This link will take you to RescueGroups instead.",
        mentionsNewTab: false,
      };
    case "animal":
    default:
      return {
        label: "View adoption listing",
        helper: `Opens ${organizationName}'s listing in a new tab.`,
        mentionsNewTab: true,
      };
  }
}

function shouldShowOrganizationWebsite(cat: Cat): boolean {
  const website = cat.organization.website;
  if (!website) return false;
  return !urlsPointToSameDestination(cat.adoptionUrl, website);
}

function urlsPointToSameDestination(left: string, right: string): boolean {
  return normalizeUrlForComparison(left) === normalizeUrlForComparison(right);
}

function normalizeUrlForComparison(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`;
  } catch {
    return value.trim().replace(/\/+$/, "").toLowerCase();
  }
}
