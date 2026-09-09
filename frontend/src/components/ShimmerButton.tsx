import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

export function ShimmerButton({ children, className = "", disabled, ...props }: Props) {
  return (
    <button
      disabled={disabled}
      className={`relative isolate overflow-hidden rounded-full px-6 py-3 text-sm font-medium tracking-wide text-[#1a140c] disabled:opacity-50 ${className}`}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300" />
      <span
        className="pointer-events-none absolute inset-0 animate-shimmer"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.7) 45%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
