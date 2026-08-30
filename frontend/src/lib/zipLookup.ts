import { ZIP_COORDINATES } from "../data/zipCoordinates";
import type { Coordinates } from "./distance";

export function isValidZipFormat(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function getCoordinatesForZip(zip: string): Coordinates | undefined {
  return ZIP_COORDINATES[zip];
}

/** A few known ZIPs to suggest when a user enters one we don't recognize. */
export const SAMPLE_KNOWN_ZIPS = ["90026", "91101", "91350", "90802", "90503"];
