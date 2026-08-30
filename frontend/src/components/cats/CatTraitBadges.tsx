import type { CatTraits } from "../../types/cat";

interface CatTraitBadgesProps {
  traits: CatTraits;
  /** Icon-only, true traits only — for cards. Full mode (labels + known-false) is for the detail page. */
  compact?: boolean;
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
  compact = false,
}: CatTraitBadgesProps) {
  const known = TRAIT_DEFS.filter((def) => traits[def.key] !== undefined);
  const visible = compact ? known.filter((def) => traits[def.key]) : known;

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((def) => {
        const value = traits[def.key];
        return (
          <span
            key={def.key}
            title={value ? def.label : `Not ${def.label.toLowerCase()}`}
            className={`pill ${value ? "" : "text-mauve-300 line-through opacity-70"}`}
          >
            <span aria-hidden="true">{def.icon}</span>
            {compact ? (
              <span className="sr-only">{def.label}</span>
            ) : (
              <span className="ml-1">
                {value ? def.label : `Not ${def.label.toLowerCase()}`}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
