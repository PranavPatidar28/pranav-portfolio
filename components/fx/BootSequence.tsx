"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/lib/content";

/**
 * Terminal/compiler boot preloader — the developer reframe of galekto's
 * broadcast "STREAM STARTING SOON" intro. Types out a fake build/boot log on
 * the phosphor-amber palette, runs a calibration bar (creeps while the scene
 * boots, completes once it's ready), then a brief power-on flash hands off to
 * the page.
 *
 *  - `active` mirrors the old Loader: true while the scene is still booting.
 *  - First-time visitors watch the sequence; returning visitors get a short
 *    calibration beat and enter as soon as the scene is ready.
 *  - prefers-reduced-motion dismisses instantly with no animation.
 *  - `onDone` fires once when the sequence finishes (or is skipped), so the
 *    page can kick off its own reveal.
 */

const BOOT_LINES = [
  "> initializing portfolio.sys",
  "> mounting modules ........................ [ OK ]",
  "  react@19.2.4 ............................ ready",
  "  next@16.2.9 ............................. ready",
  "  webgl fluid renderer .................... ready",
  "> compiling experience ................... [ OK ]",
  "> type checking .......................... 0 errors",
  "> establishing signal .................... locked",
  `> operator: ${profile.name.toUpperCase()}`,
  `> role: ${profile.role}`,
  "> ACCESS GRANTED — entering interface",
];

type Phase = "booting" | "reveal" | "done";

export default function BootSequence({
  active,
  onDone,
}: {
  active: boolean;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("booting");
  const [lineCount, setLineCount] = useState(0);
  const [pct, setPct] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [returning, setReturning] = useState(false);
  const [reduced, setReduced] = useState(false);
  const finishedRef = useRef(false);
  const finishTimeoutRef = useRef<number | null>(null);
  const activeRef = useRef(active);
  const onDoneRef = useRef(onDone);
  // mirror the latest `active` and `onDone` into refs the once-created `finish`
  // closure and the timers/intervals read, without writing during render
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const finish = useRef(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("reveal");
    onDoneRef.current?.();
    // brief power-on flash, then unmount. Tracked so an early unmount (e.g. a
    // fast skip + navigate) can clear it instead of setState-ing on a dead tree.
    finishTimeoutRef.current = window.setTimeout(() => setPhase("done"), 500);
  });

  // Clear the finish() flash timeout if we unmount before it fires.
  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current);
      }
    };
  }, []);

  // reduced-motion: skip the whole thing once the scene is ready
  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
  }, []);

  // While the boot overlay covers the page, hide #main from the tab order and
  // assistive tech so keyboard users can't Tab into content behind it (mirrors
  // the CaseStudy dialog pattern). Cleared once the sequence is done.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    if (phase !== "done") {
      main.setAttribute("inert", "");
      main.setAttribute("aria-hidden", "true");
    } else {
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    }
    return () => {
      main.removeAttribute("inert");
      main.removeAttribute("aria-hidden");
    };
  }, [phase]);

  useEffect(() => {
    if (reduced && !active) finish.current();
  }, [reduced, active]);

  // visit count → returning visitors can skip
  useEffect(() => {
    if (reduced) return;
    try {
      const key = "pp_visits";
      const n = Number(localStorage.getItem(key) || "0") + 1;
      localStorage.setItem(key, String(n));
      if (n >= 2) {
        setReturning(true);
        const t = window.setTimeout(() => setShowSkip(true), 1000);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage blocked — no skip hint, no harm
    }
  }, [reduced]);

  // Repeat visits should feel like changing channels, not rebooting a machine.
  // The static fallback is already mounted behind this cover, so it is safe to
  // hand off before WebGL finishes and let the enhanced scene join afterward.
  useEffect(() => {
    if (!returning || phase !== "booting") return;
    const t = window.setTimeout(() => finish.current(), 350);
    return () => window.clearTimeout(t);
  }, [returning, phase]);

  // type the boot log out, line by line
  useEffect(() => {
    if (reduced || phase !== "booting") return;
    if (lineCount >= BOOT_LINES.length) return;
    const t = window.setTimeout(() => setLineCount((c) => c + 1), 180);
    return () => window.clearTimeout(t);
  }, [lineCount, phase, reduced]);

  // calibration bar: creep toward 90 while booting, snap to 100 when ready
  useEffect(() => {
    if (reduced || phase !== "booting") return;
    const id = window.setInterval(() => {
      setPct((p) => {
        const ceiling = activeRef.current ? 90 : 100;
        if (p >= ceiling) return p;
        const step = activeRef.current ? Math.max(1, (90 - p) / 14) : 6;
        return Math.min(ceiling, p + step);
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [phase, reduced]);

  // once the log is fully typed AND the bar is full, hand off
  useEffect(() => {
    if (reduced || phase !== "booting") return;
    if (lineCount >= BOOT_LINES.length && pct >= 100) {
      const t = window.setTimeout(() => finish.current(), 300);
      return () => window.clearTimeout(t);
    }
  }, [lineCount, pct, phase, reduced]);

  // skip handlers
  useEffect(() => {
    if (reduced || phase !== "booting") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Escape") {
        e.preventDefault();
        finish.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, reduced]);

  if (phase === "done") return null;
  // reduced-motion while still booting: a plain, static cover (no log/flicker)
  if (reduced) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-boot"
        role="status"
        aria-live="polite"
        aria-label="Loading portfolio"
      >
        <p className="font-terminal text-amber text-2xl">{profile.name}</p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-phosphor transition-opacity duration-500 ${
        phase === "reveal" ? "opacity-0" : "opacity-100"
      }`}
      role="button"
      tabIndex={0}
      aria-label="Booting portfolio — activate to skip the intro"
      onClick={() => finish.current()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.code === "Space") {
          e.preventDefault();
          finish.current();
        }
      }}
    >
      {/* scanlines over the boot screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,176,0,0.06) 0px, rgba(255,176,0,0.06) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-20">
        {/* header */}
        <p className="font-terminal text-amber-soft text-lg sm:text-xl mb-6 tracking-wider">
          PORTFOLIO.SYS — BOOT SEQUENCE v2026
        </p>

        {/* boot log */}
        <div className="font-terminal text-amber text-base sm:text-lg leading-relaxed">
          {BOOT_LINES.slice(0, lineCount).map((line, i) => (
            <div
              key={i}
              className={line.includes("ACCESS GRANTED") ? "text-amber-ok" : undefined}
            >
              {line}
            </div>
          ))}
          {/* blinking cursor on the active line */}
          <span className="inline-block h-4 w-2.5 animate-pulse bg-amber align-middle" />
        </div>

        {/* calibration bar */}
        <div className="mt-10 max-w-md">
          <div className="flex items-center justify-between font-terminal text-amber-soft text-sm mb-2">
            <span>CALIBRATING SIGNAL</span>
            <span className="tabular-nums">{String(Math.floor(pct)).padStart(3, "0")}%</span>
          </div>
          <div className="relative h-2 w-full border border-amber/40">
            <div
              className="absolute inset-y-0 left-0 bg-amber"
              style={{ width: `${pct}%`, transition: "width 80ms linear" }}
            />
          </div>
        </div>

        {/* skip hint */}
        {showSkip && (
          <p className="mt-8 font-terminal text-sm text-amber-soft/80 animate-pulse">
            PRESS SPACE OR ESC TO SKIP · OR CLICK ANYWHERE
          </p>
        )}
      </div>
    </div>
  );
}
