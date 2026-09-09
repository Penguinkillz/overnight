import { useEffect, useRef } from "react";
import { animate } from "animejs";

type Props = { text: string; className?: string };

/** Character reveal using Anime.js (reactbits-style split text, anime instead of GSAP). */
export function SplitHeadline({ text, className = "" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = el.querySelectorAll("span[data-char]");
    animate(chars, {
      opacity: [0, 1],
      translateY: [18, 0],
      delay: (_el: unknown, i: number) => i * 28,
      duration: 700,
      ease: "out(3)",
    });
  }, [text]);

  return (
    <h1 ref={ref} className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={`${ch}-${i}`} data-char className="inline-block" style={{ opacity: 0 }}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </h1>
  );
}
