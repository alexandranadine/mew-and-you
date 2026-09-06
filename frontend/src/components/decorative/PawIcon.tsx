interface PawIconProps {
  className?: string;
}

/** Decorative cat paw print for the Mew & You header and footer. */
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
      <g transform="rotate(-16 16 16.5)">
        <path d="M4.6 13.1c.15-2.35 1.85-4.15 3.85-4.05 2.05.1 3.45 2.15 3.25 4.45-.2 2.25-2 4-4 3.85-2-.15-3.25-2-3.1-4.25z" />
        <path d="M9.15 6.35c.25-2.55 2.2-4.45 4.4-4.25 2.25.2 3.7 2.45 3.4 4.9-.25 2.4-2.3 4.25-4.5 4.05-2.2-.2-3.55-2.2-3.3-4.7z" />
        <path d="M18.05 6.15c.2-2.6 2.25-4.5 4.5-4.25 2.2.2 3.65 2.5 3.35 5-.3 2.45-2.4 4.25-4.6 4-2.2-.2-3.5-2.25-3.25-4.75z" />
        <path d="M23.35 12.55c.2-2.3 1.95-4.05 3.9-3.9 2 .15 3.3 2.2 3.1 4.4-.2 2.2-2 3.9-3.95 3.75-2-.15-3.25-2-3.05-4.25z" />
        <path d="M16.05 28.55c-5.85 0-9.45-3.7-9.45-8.05 0-3.45 2.45-5.85 5.55-6.55 1.2-.25 2.4-.15 3.5.4 1.15-.6 2.55-.75 3.95-.35 3.2.85 5.7 3.3 5.7 6.5 0 4.35-3.7 8.05-9.25 8.05z" />
      </g>
    </svg>
  );
}
