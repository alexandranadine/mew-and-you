import type { CatTraits } from "../../types/cat";

interface CatTraitBadgesProps {
  traits: CatTraits;
  /** Only show the true traits, hiding unknown/false ones — used on cards. Detail page shows everything. */
  onlyTrue?: boolean;
}

const TRAIT_DEFS: { key: keyof CatTraits; icon: string; label: string }[] = [
  { key: "goodWithDogs", icon: "🐶", label: "Good with dogs" },
  { key: "goodWithCats", icon: "🐱", label: "Good with cats" },
  { key: "goodWithChildren", icon: "🧒", label: "Good with kids" },
  { key: "houseTrained", icon: "🏠", label: "House trained" },
  { key: "spayedNeutered", icon: "⚕️", label: "Spayed/neutered" },
];

export function CatTraitBadges({
  traits,
  onlyTrue = false,
}: CatTraitBadgesProps) {
  const known = TRAIT_DEFS.filter((def) => traits[def.key] !== undefined);
  const visible = onlyTrue ? known.filter((def) => traits[def.key]) : known;

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((def) => {
        const value = traits[def.key];
        return (
          <span
            key={def.key}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              value
                ? "bg-sage-100 text-mauve-700"
                : "bg-blush-50 text-mauve-300 line-through opacity-70"
            }`}
          >
            <span aria-hidden="true">{def.icon}</span>
            {value ? def.label : `Not ${def.label.toLowerCase()}`}
          </span>
        );
      })}
    </div>
  );
}
