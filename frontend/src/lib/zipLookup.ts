export function isValidZipFormat(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}
