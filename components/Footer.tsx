"use client";

import { profile } from "@/lib/content";
import { useScrollProgress } from "@/lib/scroll-context";

// Faint CRT scanline — same values used site-wide.
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

export default function Footer() {
  const { scrollTo } = useScrollProgress();
  return (
    <footer className="relative z-10 bg-bg px-[9vw] pb-[8vh] pt-2">
      {/* broadcast sign-off — the signal closing out */}
      <div className="relative overflow-hidden border-t border-line pt-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: SCANLINE }}
        />
        <p className="relative mb-6 flex items-center justify-center gap-3 font-terminal text-sm uppercase tracking-[0.35em] text-ink-faint">
          <span aria-hidden className="h-px w-8 bg-line sm:w-16" />
          End of transmission
          <span aria-hidden className="h-px w-8 bg-line sm:w-16" />
        </p>
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <span className="font-mono text-xs text-ink-faint">
            © {profile.name} — built with Next.js & WebGL
          </span>
          <button
            onClick={() => scrollTo(0)}
            data-cursor="grow"
            className="font-mono text-xs text-ink-faint transition-colors hover:text-clay-deep"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
