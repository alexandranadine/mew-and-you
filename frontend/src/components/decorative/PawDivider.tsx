/** A row of small paw prints used as a soft section divider. */
export function PawDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-6 text-blush-300 ${className}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-5 w-5 opacity-70"
          style={{ transform: i % 2 === 0 ? "rotate(-8deg)" : "rotate(8deg)" }}
          fill="currentColor"
        >
          <circle cx="12" cy="15" r="5" />
          <circle cx="5" cy="8" r="2.4" />
          <circle cx="10" cy="4" r="2.4" />
          <circle cx="15" cy="4" r="2.4" />
          <circle cx="19" cy="8" r="2.4" />
        </svg>
      ))}
    </div>
  );
}
