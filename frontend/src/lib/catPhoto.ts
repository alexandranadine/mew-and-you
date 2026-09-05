import type { CatPhoto } from "../types/cat";

/**
 * RescueGroups documents `small` as max ~100px wide and `large` as max ~500px.
 * Our mapper stores those as `thumbnailUrl` and `url` respectively.
 */
export const CAT_PHOTO_THUMB_WIDTH = 100;
export const CAT_PHOTO_FULL_WIDTH = 500;

/**
 * Matches the search/home/favorites card grid:
 * max-w-6xl + px-6, 1 / 2 / 3 columns at default / sm / lg, gap-6.
 */
export const CAT_CARD_IMAGE_SIZES =
  "(max-width: 639px) calc(100vw - 48px), (max-width: 1023px) calc((100vw - 72px) / 2), 368px";

export interface CatCardImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Picks card image URLs, offering small+large as responsive candidates when both
 * are available so the browser can match card width × DPR without downloading
 * originals. Skips any URLs already known to have failed.
 */
export function selectCatCardImage(
  photo: CatPhoto | undefined,
  failedSrcs: ReadonlySet<string> = new Set(),
): CatCardImageProps | undefined {
  if (!photo) return undefined;

  const thumb =
    photo.thumbnailUrl && !failedSrcs.has(photo.thumbnailUrl)
      ? photo.thumbnailUrl
      : undefined;
  const full =
    photo.url && !failedSrcs.has(photo.url) ? photo.url : undefined;

  if (!thumb && !full) return undefined;

  if (thumb && full && thumb !== full) {
    return {
      // Prefer large as the plain-src fallback for clients without srcSet.
      src: full,
      srcSet: `${thumb} ${CAT_PHOTO_THUMB_WIDTH}w, ${full} ${CAT_PHOTO_FULL_WIDTH}w`,
      sizes: CAT_CARD_IMAGE_SIZES,
    };
  }

  return { src: (full ?? thumb)! };
}
