import type {
  Cat,
  CatAgeGroup,
  CatOrganization,
  CatPhoto,
  CatSex,
  CatSize,
} from "../../models/cat";
import type {
  RgAnimalResource,
  RgIncludedResource,
  RgLocationAttributes,
  RgOrgAttributes,
  RgPictureAttributes,
  RgResourceRef,
} from "./types";

function indexIncluded(
  included: RgIncludedResource[],
): Map<string, RgIncludedResource> {
  const byTypeId = new Map<string, RgIncludedResource>();
  for (const item of included) {
    byTypeId.set(`${item.type}:${item.id}`, item);
  }
  return byTypeId;
}

function firstRef(
  data: RgResourceRef | RgResourceRef[] | null | undefined,
): RgResourceRef | undefined {
  if (!data) return undefined;
  return Array.isArray(data) ? data[0] : data;
}

function toRefArray(
  data: RgResourceRef | RgResourceRef[] | null | undefined,
): RgResourceRef[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function boolOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function mapAgeGroup(value: string | null | undefined): CatAgeGroup {
  switch ((value ?? "").trim().toLowerCase()) {
    case "baby":
      return "baby";
    case "young":
    case "young adult":
      return "young";
    case "adult":
      return "adult";
    case "senior":
      return "senior";
    default:
      return "unknown";
  }
}

function mapSex(value: string | null | undefined): CatSex {
  switch ((value ?? "").trim().toLowerCase()) {
    case "male":
      return "male";
    case "female":
      return "female";
    default:
      return "unknown";
  }
}

function mapSize(value: string | null | undefined): CatSize {
  switch ((value ?? "").trim().toLowerCase()) {
    case "small":
      return "small";
    case "medium":
      return "medium";
    case "large":
    case "x-large":
    case "xlarge":
    case "extra large":
      return "large";
    default:
      return "unknown";
  }
}

function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

function buildBreedLabel(attrs: RgAnimalResource["attributes"]): string {
  const primary = attrs.breedPrimary?.trim();
  if (primary) {
    return attrs.isBreedMixed ? `${primary} Mix` : primary;
  }
  const breedString = attrs.breedString?.trim();
  if (breedString) return breedString;
  return "Breed unknown";
}

function firstHttpUrl(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return undefined;
}

function pictureUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string") {
      const trimmed = url.trim();
      return trimmed || undefined;
    }
  }
  return undefined;
}

function buildAdoptionUrl(
  animalUrl: string | null | undefined,
  orgAttrs: RgOrgAttributes,
): string {
  return (
    firstHttpUrl(animalUrl, orgAttrs.adoptionUrl, orgAttrs.url) ??
    "https://www.rescuegroups.org/"
  );
}

/**
 * Maps a single RescueGroups animal (plus its `included` resources) into our
 * normalized `Cat`. Every field is defensive: missing/null upstream data
 * degrades to a sensible default instead of throwing.
 */
export function mapRescueGroupsAnimal(
  animal: RgAnimalResource,
  included: RgIncludedResource[] = [],
): Cat {
  const byRef = indexIncluded(included);
  const attrs = animal.attributes ?? {};

  const orgRef = firstRef(animal.relationships?.orgs?.data);
  const orgResource = orgRef
    ? byRef.get(`${orgRef.type}:${orgRef.id}`)
    : undefined;
  const orgAttrs = (orgResource?.attributes ?? {}) as RgOrgAttributes;

  const locationRef = firstRef(animal.relationships?.locations?.data);
  const locationResource = locationRef
    ? byRef.get(`${locationRef.type}:${locationRef.id}`)
    : undefined;
  const locationAttrs = (locationResource?.attributes ??
    {}) as RgLocationAttributes;

  const pictureRefs = toRefArray(animal.relationships?.pictures?.data);
  const photos: CatPhoto[] = pictureRefs
    .map((ref) => byRef.get(`${ref.type}:${ref.id}`))
    .filter((resource): resource is RgIncludedResource => Boolean(resource))
    .map((resource): CatPhoto | undefined => {
      const pic = resource.attributes as RgPictureAttributes;
      const full =
        pictureUrl(pic.large) ??
        pictureUrl(pic.original) ??
        pictureUrl(pic.small);
      const thumb = pictureUrl(pic.small) ?? full;
      return full ? { url: full, thumbnailUrl: thumb } : undefined;
    })
    .filter((photo): photo is CatPhoto => Boolean(photo));

  if (photos.length === 0 && attrs.pictureThumbnailUrl) {
    photos.push({
      url: attrs.pictureThumbnailUrl,
      thumbnailUrl: attrs.pictureThumbnailUrl,
    });
  }

  // Most animals don't have a distinct `locations` relationship — fall back to
  // the org's address, which is where RescueGroups animals are usually located.
  const city = locationAttrs.city ?? orgAttrs.city ?? "Unknown";
  const state = locationAttrs.state ?? orgAttrs.state ?? "";
  const zip = locationAttrs.postalcode ?? orgAttrs.postalcode ?? "";
  const lat =
    numberOrUndefined(locationAttrs.lat) ??
    numberOrUndefined(orgAttrs.lat) ??
    0;
  const lng =
    numberOrUndefined(locationAttrs.lon) ??
    numberOrUndefined(orgAttrs.lon) ??
    0;

  const ageGroup = mapAgeGroup(attrs.ageGroup);
  const age =
    cleanText(attrs.ageString) ||
    (ageGroup !== "unknown" ? capitalize(ageGroup) : "Age unknown");

  const organization: CatOrganization = {
    id: orgRef
      ? `rescuegroups:${orgRef.id}`
      : `rescuegroups:unknown-org-${animal.id}`,
    name: orgAttrs.name?.trim() || "Unknown organization",
    city,
    state,
    zip,
    phone: orgAttrs.phone?.trim() || undefined,
    email: orgAttrs.email?.trim() || undefined,
    website: orgAttrs.url?.trim() || undefined,
  };

  return {
    id: `rescuegroups:${animal.id}`,
    source: "rescuegroups",
    name: attrs.name?.trim() || "Unnamed cat",
    breed: buildBreedLabel(attrs),
    age,
    ageGroup,
    sex: mapSex(attrs.sex),
    size: mapSize(attrs.sizeGroup),
    description:
      cleanText(attrs.descriptionText) ||
      cleanText(attrs.descriptionHtml) ||
      "No description provided yet.",
    photos,
    organization,
    location: { zip, city, state, lat, lng },
    traits: {
      goodWithDogs: boolOrUndefined(attrs.isDogsOk),
      goodWithCats: boolOrUndefined(attrs.isCatsOk),
      goodWithChildren: boolOrUndefined(attrs.isKidsOk),
      houseTrained: boolOrUndefined(attrs.isHousetrained),
    },
    adoptionUrl: buildAdoptionUrl(attrs.url, orgAttrs),
  };
}
