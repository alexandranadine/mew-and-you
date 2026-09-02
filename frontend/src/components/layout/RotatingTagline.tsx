import { useEffect, useState } from "react";
import { brand } from "../../config/brand";

export default function RotatingTagline() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * brand.taglines.length),
  );

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Users who've asked for reduced motion still get a tagline, it just
    // doesn't auto-change or animate — avoids distracting/flashing content.
    if (motionQuery.matches) return;

    let timeoutId: number;

    const intervalId = window.setInterval(() => {
      setVisible(false);

      timeoutId = window.setTimeout(() => {
        setIndex((current) => (current + 1) % brand.taglines.length);
        setVisible(true);
      }, 500);
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
      }`}
    >
      {brand.taglines[index]}
    </span>
  );
}
