interface PawIconProps {
  className?: string;
}

/** Decorative brand paw mark, adapted from the Mew & You favicon geometry. */
export function PawIcon({ className = "" }: PawIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="3.1" />
      <circle cx="21" cy="11" r="3.1" />
      <circle cx="8.2" cy="18.2" r="2.6" />
      <circle cx="23.8" cy="18.2" r="2.6" />
      <ellipse cx="16" cy="21.2" rx="4.6" ry="3.8" />
    </svg>
  );
}
