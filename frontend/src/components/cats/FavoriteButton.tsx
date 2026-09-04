import { useFavorites } from "../../hooks/useFavorites";

interface FavoriteButtonProps {
  catId: string;
  catName: string;
  className?: string;
  /** Larger hit target for detail pages. */
  size?: "sm" | "md";
}

export function FavoriteButton({
  catId,
  catName,
  className = "",
  size = "sm",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(catId);

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
      }}
      className={`focus-ring inline-flex ${dim} items-center justify-center rounded-full border transition ${
        saved
          ? "border-blush-300 bg-blush-50 text-blush-600 shadow-[var(--shadow-cozy-sm)]"
          : "border-blush-100 bg-white/90 text-mauve-400 hover:border-blush-200 hover:text-mauve-600"
      } ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={icon}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={saved ? 0 : 1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.7-4.35-9.33-8.48C.8 9.5 2.05 5.75 5.6 4.6c1.9-.62 3.95-.1 5.4 1.32 1.45-1.42 3.5-1.94 5.4-1.32 3.55 1.15 4.8 4.9 2.93 7.92C18.7 16.65 12 21 12 21z"
        />
      </svg>
    </button>
  );
}
