"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";

type ScrollCtx = {
  progress: number;
  lenis: Lenis | null;
  scrollTo: (target: string | number) => void;
};

const ScrollContext = createContext<ScrollCtx>({
  progress: 0,
  lenis: null,
  scrollTo: () => {},
});

export function useScrollProgress() {
  return useContext(ScrollContext);
}

// There are 5 zones; bucket progress into that many steps so we only
// re-render React on real section changes, not every 1% of scroll.
const SECTION_COUNT = 5;

export function ScrollProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);
  const [lenisReady, setLenisReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const lenis = new Lenis({
      duration: prefersReduced ? 0 : 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    setLenisReady(true);

    let lastBucket = -1;
    lenis.on("scroll", ({ scroll, limit }: { scroll: number; limit: number }) => {
      const p = limit > 0 ? scroll / limit : 0;
      const bucket = Math.min(
        SECTION_COUNT,
        Math.floor(p * SECTION_COUNT + 0.0001)
      );
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        setProgress(p);
      }
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      setLenisReady(false);
    };
  }, [enabled]);

  const scrollTo = useCallback((target: string | number) => {
    const lenis = lenisRef.current;
    if (!lenis) {
      if (typeof target === "string") {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  }, []);

  const value = useMemo<ScrollCtx>(
    () => ({
      progress,
      lenis: lenisRef.current,
      scrollTo,
    }),
    // lenisReady flips once the instance exists so consumers that need the
    // Lenis object (e.g. scroll lock) pick it up. Intentional dep, not stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, scrollTo, lenisReady]
  );

  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  );
}
