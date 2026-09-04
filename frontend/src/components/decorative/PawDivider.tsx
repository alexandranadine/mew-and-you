import pawDivider from "../../assets/mew-and-you-divider.png";

interface PawDividerProps {
  className?: string;
}

/** Decorative floral paw divider used between page sections. */
export function PawDivider({ className = "" }: PawDividerProps) {
  return (
    <div className={`pb-8 ${className}`} aria-hidden="true">
      <div className="flex h-16 items-center justify-center overflow-hidden">
        <img
          src={pawDivider}
          alt=""
          width={680}
          height={453}
          loading="lazy"
          decoding="async"
          className="pointer-events-none h-auto w-[280px] select-none sm:w-[340px]"
        />
      </div>
    </div>
  );
}
