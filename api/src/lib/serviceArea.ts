import { SERVICE_AREA_ZIP_RANGES } from "../data/southernCaliforniaServiceArea";
import { ApiError } from "./errors";

export const OUTSIDE_SERVICE_AREA_CODE = "OUTSIDE_SERVICE_AREA";
export const OUTSIDE_SERVICE_AREA_MESSAGE =
  "Mew & You currently searches Southern California only.";

function expandZipRanges(
  ranges: ReadonlyArray<readonly [string, string]>,
): Set<string> {
  const zips = new Set<string>();
  for (const [start, end] of ranges) {
    const from = Number(start);
    const to = Number(end);
    for (let n = from; n <= to; n += 1) {
      zips.add(String(n).padStart(5, "0"));
    }
  }
  return zips;
}

const SUPPORTED_SERVICE_AREA_ZIPS = expandZipRanges(SERVICE_AREA_ZIP_RANGES);

export function isSupportedServiceAreaZip(zip: string): boolean {
  return SUPPORTED_SERVICE_AREA_ZIPS.has(zip);
}

/** Call after validateZip — format errors must win over service-area errors. */
export function assertSupportedServiceAreaZip(zip: string): void {
  if (!isSupportedServiceAreaZip(zip)) {
    throw new ApiError(
      OUTSIDE_SERVICE_AREA_MESSAGE,
      400,
      OUTSIDE_SERVICE_AREA_CODE,
    );
  }
}
