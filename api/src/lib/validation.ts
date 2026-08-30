import { ApiError } from './errors';

const MAX_RADIUS_MILES = 500;
const DEFAULT_RADIUS_MILES = 25;

export function validateZip(raw: unknown): string {
  const zip = typeof raw === 'string' ? raw.trim() : '';
  if (!zip) {
    throw new ApiError('A "zip" query parameter is required.', 400, 'missing_zip');
  }
  if (!/^\d{5}$/.test(zip)) {
    throw new ApiError(`"${zip}" is not a valid 5-digit ZIP code.`, 400, 'invalid_zip');
  }
  return zip;
}

export function validateRadius(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_RADIUS_MILES;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_RADIUS_MILES) {
    throw new ApiError(
      `"${String(raw)}" is not a valid search radius (must be between 1 and ${MAX_RADIUS_MILES} miles).`,
      400,
      'invalid_radius',
    );
  }
  return value;
}

/** Our normalized Cat ids are namespaced, e.g. "rescuegroups:12345". */
export function parseRescueGroupsAnimalId(raw: string): string {
  const prefix = 'rescuegroups:';
  const id = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  if (!/^\d+$/.test(id)) {
    throw new ApiError(`"${raw}" is not a valid cat id.`, 400, 'invalid_id');
  }
  return id;
}
