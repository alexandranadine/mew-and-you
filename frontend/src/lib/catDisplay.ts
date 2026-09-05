import { ageGroupLabel } from "./searchOptions";
import type { Cat, CatSex, CatSize } from "../types/cat";

/** Backend mapper placeholder — treat as missing on the client. */
const EMPTY_DESCRIPTION_PATTERN = /^no description provided yet\.?$/i;

export function hasRealDescription(description: string): boolean {
  const trimmed = description.replace(/\s+/g, " ").trim();
  if (!trimmed) return false;
  return !EMPTY_DESCRIPTION_PATTERN.test(trimmed);
}

export function missingBioMessage(catName: string): string {
  return `This shelter hasn’t added a bio for ${catName} yet.`;
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
