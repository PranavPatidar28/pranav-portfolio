"use client";

import Image from "next/image";
import type { Project } from "@/lib/content";

/* ============================================================
   PROJECT VISUAL
   The on-screen image for a project. If a real screenshot exists
   (project.image) it's shown behind a faint CRT treatment; otherwise
   we synthesize a "broadcast monitor" card — a dark phosphor panel with
   a slug-seeded tint, scanlines, a channel number, the title in giant
   condensed type, and a stack ticker. Either way it reads as a tuned-in
   signal, on-brand with the boot/CRT concept.

   Shared by the hover preview (variant="card") and the case-study hero
   (variant="hero"), so a screenshot dropped into /public upgrades both
   at once with no further wiring.
   ============================================================ */

// Deterministic 0..1 hash from the slug — same project always tints the same.
function seed(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 to unsigned, normalise
  return ((h >>> 0) % 1000) / 1000;
}

export default function ProjectVisual({
  project,
  variant = "card",
  className = "",
  index,
}: {
  project: Project;
  variant?: "card" | "hero";
  className?: string;
  /** 1-based channel number; falls back to a seeded one. */
  index?: number;
}) {
  const hero = variant === "hero";
  const s = seed(project.slug);
  // Two clay-family hues drifting around the accent, seeded per project, so
  // each generated card feels distinct without leaving the palette.
  const hueA = 12 + Math.round(s * 26); // ~clay range
  const hueB = (hueA + 18 + Math.round(s * 40)) % 360;
  const channel = String(index ?? Math.round(s * 80) + 10).padStart(2, "0");

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-boot ${className}`}
    >
      {project.image ? (
        // Real screenshot, dimmed slightly so the scanline/vignette CRT
        // overlays read on top of it.
        <Image
          src={project.image}
          alt={`${project.title} — ${project.subtitle}`}
          fill
          sizes={
            hero
              ? "(max-width: 768px) calc(100vw - 48px), 672px"
              : "(max-width: 768px) calc(100vw - 48px), 480px"
          }
          className="object-cover"
          style={{ objectPosition: project.imagePosition }}
          priority={false}
        />
      ) : (
        // Synthesized broadcast card.
        <>
          {/* seeded gradient wash */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 120% at ${
                20 + s * 60
              }% 0%, hsl(${hueA} 70% 22%) 0%, #1a1614 55%, #0c0a09 100%), linear-gradient(135deg, hsl(${hueB} 55% 18% / 0.7), transparent 60%)`,
            }}
          />
          {/* faint giant title watermark */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <span
              className="font-condensed leading-none text-amber/[0.07] select-none"
              style={{ fontSize: hero ? "clamp(5rem,18vw,12rem)" : "5.5rem" }}
            >
              {project.title.split(" ")[0]}
            </span>
          </div>
          {/* foreground content */}
          <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
            <div className="flex items-start justify-between font-terminal text-amber-soft">
              <span className="text-lg leading-none tracking-wide">
                CH&nbsp;{channel}
              </span>
              <span className="flex items-center gap-1.5 text-base">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_8px_var(--color-signal-bright)]" />
                LIVE
              </span>
            </div>

            <div>
              <p className="font-terminal text-sm uppercase tracking-[0.2em] text-amber/70">
                {project.domain}
              </p>
              <h3
                className="font-condensed uppercase leading-[0.85] text-amber"
                style={{ fontSize: hero ? "clamp(2.5rem,7vw,5rem)" : "2rem" }}
              >
                {project.title}
              </h3>
              {/* stack ticker */}
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[0.62rem] uppercase tracking-wider text-amber-soft/60">
                {project.stack.slice(0, hero ? 7 : 4).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CRT overlays — scanlines + vignette + bezel hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-amber/10" />
    </div>
  );
}
