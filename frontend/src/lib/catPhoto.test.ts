import { describe, expect, it } from "vitest";
import {
  CAT_CARD_IMAGE_SIZES,
  CAT_PHOTO_FULL_WIDTH,
  CAT_PHOTO_THUMB_WIDTH,
  selectCatCardImage,
} from "./catPhoto";

const thumb = "https://cdn.example.org/small.jpg";
const full = "https://cdn.example.org/large.jpg";

describe("selectCatCardImage", () => {
  it("returns undefined when there is no photo", () => {
    expect(selectCatCardImage(undefined)).toBeUndefined();
    expect(selectCatCardImage({ url: "" })).toBeUndefined();
  });

  it("offers small + large as srcSet candidates when both exist", () => {
    expect(
      selectCatCardImage({ url: full, thumbnailUrl: thumb }),
    ).toEqual({
      src: full,
      srcSet: `${thumb} ${CAT_PHOTO_THUMB_WIDTH}w, ${full} ${CAT_PHOTO_FULL_WIDTH}w`,
      sizes: CAT_CARD_IMAGE_SIZES,
    });
  });

  it("uses a single src when only one URL is available", () => {
    expect(selectCatCardImage({ url: full })).toEqual({ src: full });
    expect(selectCatCardImage({ url: full, thumbnailUrl: full })).toEqual({
      src: full,
    });
  });

  it("falls back to thumbnail alone when the large URL has failed", () => {
    expect(
      selectCatCardImage(
        { url: full, thumbnailUrl: thumb },
        new Set([full]),
      ),
    ).toEqual({ src: thumb });
  });

  it("falls back to large alone when the thumbnail URL has failed", () => {
    expect(
      selectCatCardImage(
        { url: full, thumbnailUrl: thumb },
        new Set([thumb]),
      ),
    ).toEqual({ src: full });
  });

  it("returns undefined when every candidate has failed", () => {
    expect(
      selectCatCardImage(
        { url: full, thumbnailUrl: thumb },
        new Set([full, thumb]),
      ),
    ).toBeUndefined();
  });
});
