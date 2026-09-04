import { useState } from "react";
import { useFavorites } from "../../hooks/useFavorites";

interface FavoriteButtonProps {
  catId: string;
  catName: string;
  className?: string;
  /** Larger hit target for detail pages. */
  size?: "sm" | "md";
}

/**
 * Feather-style heart: circular arcs for the lobes so the stroke
 * stays even at the cleft and tip (fill paths look ragged when stroked).
 */
const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

export function FavoriteButton({
  catId,
  catName,
  className = "",
  size = "sm",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(catId);
  const [popping, setPopping] = useState(false);

  const dim = size === "md" ? "h-11 w-11" : "h-10 w-10";
  const icon = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${catName} from favorites`
          : `Save ${catName} to favorites`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(catId);
        setPopping(true);
      }}
      className={`focus-ring inline-flex ${dim} items-center justify-center rounded-full border transition-[color,background-color,border-color,box-shadow] duration-200 ease-out ${
        saved
          ? "border-blush-300 bg-blush-50 text-blush-500 shadow-[var(--shadow-cozy-sm)]"
          : "border-blush-100 bg-white/90 text-mauve-400 hover:border-blush-200 hover:text-mauve-600"
      } ${className}`}
    >
      <span
        className={`inline-flex ${popping ? "favorite-heart-pop" : ""}`}
        onAnimationEnd={() => setPopping(false)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className={icon}
        >
          {/* Filled heart — fades/scales in when saved */}
          <path
            d={HEART_PATH}
            fill="currentColor"
            stroke="none"
            className={`origin-center transition-[opacity,transform] duration-200 ease-out ${
              saved ? "scale-100 opacity-100" : "scale-[0.72] opacity-0"
            }`}
          />
          {/* Outline heart — visible when unsaved */}
          <path
            d={HEART_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-opacity duration-200 ease-out ${
              saved ? "opacity-0" : "opacity-100"
            }`}
          />
        </svg>
      </span>
    </button>
  );
}
