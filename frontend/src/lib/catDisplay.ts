import { ageGroupLabel } from "./searchOptions";
import type { Cat, CatSex, CatSize } from "../types/cat";

/** Backend mapper placeholder — treat as missing on the client. */
const EMPTY_DESCRIPTION_PATTERN = /^no description provided yet\.?$/i;

/** Kennel / shelter ID style values (e.g. A1928701) — leave unchanged. */
const KENNEL_ID_PATTERN = /^[A-Z]{1,3}\d{3,}[A-Z0-9]*$/i;

/** Whole-name short initialisms (JJ, RJ, ED). */
const SHORT_INITIALISM_PATTERN = /^[A-Z]{2}$/;

export function hasRealDescription(description: string): boolean {
  const trimmed = description.replace(/\s+/g, " ").trim();
  if (!trimmed) return false;
  return !EMPTY_DESCRIPTION_PATTERN.test(trimmed);
}

/**
 * Friendly display form of a cat name. Does not mutate the source value.
 * Only normalizes when every alphabetic character is uppercase.
 */
export function formatCatDisplayName(name: string): string {
  if (!name) return name;

  const letters = name.replace(/[^A-Za-z]/g, "");
  if (!letters) return name;
  // Mixed or already title-cased — leave alone (Mary-Kate, KitKat, etc.).
  if (/[a-z]/.test(letters)) return name;

  const trimmed = name.trim();
  if (KENNEL_ID_PATTERN.test(trimmed)) return name;
  if (SHORT_INITIALISM_PATTERN.test(trimmed)) return name;

  return name.replace(/\([^)]*\)|[A-Z0-9][A-Z0-9'’\-.]*/gi, (token) => {
    if (token.startsWith("(") && token.endsWith(")")) {
      const inner = token.slice(1, -1);
      // Preserve short parenthetical acronyms like (CB).
      if (/^[A-Z]{1,5}$/.test(inner)) return token;
      return `(${titleCaseAllCapsSegment(inner)})`;
    }
    return titleCaseAllCapsSegment(token);
  });
}

function titleCaseAllCapsSegment(segment: string): string {
  return segment
    .split(/([-'’])/)
    .map((part) => {
      if (part === "-" || part === "'" || part === "’") return part;
      if (!/[A-Za-z]/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

export function missingBioMessage(catName: string): string {
  const displayName = formatCatDisplayName(catName);
  return `This shelter hasn’t added a bio for ${displayName} yet.`;
}

export function isUnknownAge(cat: Pick<Cat, "age" | "ageGroup">): boolean {
  if (cat.ageGroup !== "unknown") return false;
  const age = cat.age.trim();
  return !age || /^age unknown$/i.test(age);
}

export function isUnknownSex(sex: CatSex): boolean {
  return sex === "unknown";
}

export function isUnknownSize(size: CatSize): boolean {
  return size === "unknown";
}

export function ageDisplayLabel(
  cat: Pick<Cat, "age" | "ageGroup">,
): string | null {
  if (isUnknownAge(cat)) return null;
  const age = cat.age.trim();
  return age || null;
}

export function sexDisplayLabel(sex: CatSex): string | null {
  if (sex === "male") return "Male";
  if (sex === "female") return "Female";
  return null;
}

export function sizeDisplayLabel(size: CatSize): string | null {
  if (isUnknownSize(size)) return null;
  return size.charAt(0).toUpperCase() + size.slice(1);
}

/** Card metadata row parts, omitting unknown age/sex/size. */
export function catCardMetadataParts(
  cat: Pick<Cat, "age" | "ageGroup" | "sex" | "size">,
): string[] {
  return [
    ageDisplayLabel(cat),
    sexDisplayLabel(cat.sex),
    sizeDisplayLabel(cat.size),
  ].filter((part): part is string => part != null);
}

/** Join known attributes with middots; empty when all are unknown. */
export function formatCatCardMetadata(
  cat: Pick<Cat, "age" | "ageGroup" | "sex" | "size">,
): string {
  return catCardMetadataParts(cat).join(" · ");
}

export type CatDetailAttribute = {
  key: "age" | "sex" | "size";
  label: string;
  value: string;
  subvalue?: string;
};

/** Detail-page attribute cells; unknown age/sex/size are omitted entirely. */
export function getCatDetailAttributes(
  cat: Pick<Cat, "age" | "ageGroup" | "sex" | "size">,
): CatDetailAttribute[] {
  const attrs: CatDetailAttribute[] = [];

  const age = ageDisplayLabel(cat);
  if (age) {
    attrs.push({
      key: "age",
      label: "Age",
      value: age,
      subvalue:
        cat.ageGroup !== "unknown" ? ageGroupLabel(cat.ageGroup) : undefined,
    });
  }

  const sex = sexDisplayLabel(cat.sex);
  if (sex) {
    attrs.push({ key: "sex", label: "Sex", value: sex });
  }

  const size = sizeDisplayLabel(cat.size);
  if (size) {
    attrs.push({ key: "size", label: "Size", value: size });
  }

  return attrs;
}
