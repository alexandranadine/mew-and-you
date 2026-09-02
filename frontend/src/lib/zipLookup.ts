export function isValidZipFormat(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

/** A few LA County ZIPs to suggest as example searches. */
export const SAMPLE_KNOWN_ZIPS = ["90026", "91101", "91350", "90802", "90503"];
