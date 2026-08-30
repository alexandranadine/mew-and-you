/**
 * Mock "geocoding" for ZIP codes across LA County, used only by MockCatProvider
 * until DATA_PROVIDER=rescuegroups is enabled (RescueGroups does real geocoding).
 */
export const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "90026": { lat: 34.09, lng: -118.2688 }, // Silver Lake / Echo Park, LA
  "90042": { lat: 34.1092, lng: -118.1937 }, // Highland Park, LA
  "90004": { lat: 34.0762, lng: -118.3088 }, // Koreatown, LA
  "91401": { lat: 34.1867, lng: -118.4487 }, // Van Nuys
  "90802": { lat: 33.7701, lng: -118.1937 }, // Long Beach
  "91101": { lat: 34.1478, lng: -118.1445 }, // Pasadena
  "91350": { lat: 34.3917, lng: -118.5426 }, // Santa Clarita / Newhall
  "90503": { lat: 33.8358, lng: -118.3406 }, // Torrance
  "90401": { lat: 34.0195, lng: -118.4912 }, // Santa Monica
  "91502": { lat: 34.1808, lng: -118.309 }, // Burbank
  "91204": { lat: 34.1425, lng: -118.2551 }, // Glendale
  "91766": { lat: 34.0551, lng: -117.75 }, // Pomona
  "90025": { lat: 34.0459, lng: -118.4473 }, // West LA
  "90230": { lat: 34.0019, lng: -118.3965 }, // Culver City
  "90301": { lat: 33.9617, lng: -118.3531 }, // Inglewood
  "90220": { lat: 33.8958, lng: -118.2201 }, // Compton
  "90601": { lat: 33.9789, lng: -118.0164 }, // Whittier
  "91731": { lat: 34.0686, lng: -118.0276 }, // El Monte
  "91775": { lat: 34.1017, lng: -118.0956 }, // San Gabriel
  "91601": { lat: 34.1808, lng: -118.3773 }, // North Hollywood
  "91335": { lat: 34.2011, lng: -118.5353 }, // Reseda
  "91367": { lat: 34.1684, lng: -118.6059 }, // Woodland Hills
  "90712": { lat: 33.8536, lng: -118.137 }, // Lakewood
  "90650": { lat: 33.9022, lng: -118.0817 }, // Norwalk
  "90706": { lat: 33.8825, lng: -118.117 }, // Bellflower
};

/** A few known ZIPs to suggest when mock mode can't resolve one. */
export const SAMPLE_KNOWN_ZIPS = ["90026", "91101", "91350", "90802", "90503"];

export function getMockCoordinatesForZip(
  zip: string,
): { lat: number; lng: number } | undefined {
  return ZIP_COORDINATES[zip];
}
