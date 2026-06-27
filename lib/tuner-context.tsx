"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { navZones } from "@/lib/content";
import { useScrollProgress } from "@/lib/scroll-context";

/**
 * The CRT "channel tuner" — the single source of truth that unifies the two
 * navs that used to collide on the right edge:
 *   - the global zone rail (Nav) → now a vertical CH 01–05 tuner, and
 *   - the giant hero numeral → now the big "NOW TUNED · CH 0X" readout.
 *
 * Both read `focusedChannel`, so they are demonstrably ONE system. Channel
 * (0–4) lives here, NOT in scroll-context: scroll-context memoizes on bucketed
 * progress (deliberately rare re-renders), and high-frequency `hoverChannel`
 * would thrash its consumers. This provider wraps only Nav + main + the glitch
 * overlay, and the page sections are passed as JSX children of <main>, so a
 * hover change re-renders only the tuner consumers — never the section bodies.
 */

type Channel = (typeof navZones)[number];

type TunerCtx = {
  channels: readonly Channel[];
  /** the channel the scroll position is actually on (the truth for aria-current) */
  activeChannel: number;
  /** the channel being hovered / keyboard-focused in the tuner, if any */
  hoverChannel: number | null;
  /** what the lit UI shows: hover preview wins, else the scroll-active channel */
  focusedChannel: number;
  setHoverChannel: (i: number | null) => void;
  /** scroll to a channel's section and fire the channel-change glitch */
  tuneTo: (i: number) => void;
  /** bumped on each tune so the glitch overlay remounts and replays */
  glitchKey: number;
  /** true for ~1s after load — the hero "powers on" dark, then warms to the
   *  bright stage. Drives the hero darkening chrome AND the light-over-dark
   *  Nav ink, so they flip in lockstep. */
  heroDark: boolean;
};

const TunerContext = createContext<TunerCtx>({
  channels: navZones,
  activeChannel: 0,
  hoverChannel: null,
  focusedChannel: 0,
  setHoverChannel: () => {},
  tuneTo: () => {},
  glitchKey: 0,
  heroDark: false,
});

export function useTuner() {
  return useContext(TunerContext);
}

export function TunerProvider({ children }: { children: ReactNode }) {
  const { scrollTo } = useScrollProgress();
  const [hoverChannel, setHoverChannel] = useState<number | null>(null);
  const [activeChannel, setActiveChannel] = useState(0);
  const [glitchKey, setGlitchKey] = useState(0);
  // Hero "powers on" dark, then warms to the bright stage after ~1s. Start true
  // so the very first paint is the dark screen; reduced-motion skips it.
  const [heroDark, setHeroDark] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setHeroDark(false);
      return;
    }
    const t = window.setTimeout(() => setHeroDark(false), 1000);
    return () => window.clearTimeout(t);
  }, []);

  // Active channel = the section currently crossing the viewport CENTRE.
  // Replaces the old guess (bucketed scroll progress matched against hardcoded
  // ZONE_POINTS), which lagged 1–2 sections behind because section heights are
  // content-driven and `progress` only updated at coarse 20% boundaries. A
  // center-line IntersectionObserver keeps the set of centre-crossing sections
  // fresh; a rAF-throttled scroll listener re-picks each frame so the bottom
  // fallback is evaluated continuously (observers fire only on transitions).
  useEffect(() => {
    const sections = navZones
      .map((z) => document.getElementById(z.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // Sections currently straddling the centre line (maintained by the observer).
    const visible = new Set<HTMLElement>();

    const pick = () => {
      // Bottom-edge fallback: a short final section may never reach centre.
      // Within ~2px of the page bottom, force the last channel.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveChannel(sections.length - 1);
        return;
      }
      if (visible.size === 0) return;
      // Topmost centre-crossing section wins.
      let topIdx = -1;
      let topY = Infinity;
      for (const el of visible) {
        const y = el.getBoundingClientRect().top;
        if (y < topY) {
          topY = y;
          topIdx = sections.indexOf(el);
        }
      }
      if (topIdx >= 0) setActiveChannel(topIdx);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
          else visible.delete(entry.target as HTMLElement);
        }
        pick();
      },
      // Zero-height band at the vertical centre: a section "intersects" only
      // while it covers screen-middle, so exactly the centred section is active.
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));

    // rAF-throttled scroll listener — only re-evaluates the bottom fallback
    // (the observer already drives the common case). Cheap: one bounds read.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pick();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const focusedChannel = hoverChannel ?? activeChannel;

  // Fire the channel-change glitch ONLY on a deliberate tune (clicking/tapping
  // a channel in the navbar or the hero readout) — never on plain scrolling.
  const tuneTo = useCallback(
    (i: number) => {
      setGlitchKey((k) => k + 1);
      scrollTo(`#${navZones[i].id}`);
    },
    [scrollTo]
  );

  const value = useMemo<TunerCtx>(
    () => ({
      channels: navZones,
      activeChannel,
      hoverChannel,
      focusedChannel,
      setHoverChannel,
      tuneTo,
      glitchKey,
      heroDark,
    }),
    [activeChannel, hoverChannel, focusedChannel, tuneTo, glitchKey, heroDark]
  );

  return (
    <TunerContext.Provider value={value}>{children}</TunerContext.Provider>
  );
}
