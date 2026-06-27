"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Slot-machine name reveal. Each character is an independent "reel" that spins
 * through a few random letters before landing on its target. The whole word
 * swaps between two values depending on which half of the viewport the cursor
 * is on (left → wordA, right → wordB) — the galekto first-name/handle mechanic,
 * here PRANAV / PATIDAR.
 *
 * SSR-safe: renders wordA statically until the client takes over.
 * Reduced-motion / touch: no spinning, no swap — just the resolved letters.
 * The animated glyphs are aria-hidden; pass the real name via `aria-label` on
 * the wrapping element (Hero does this on the <h1>).
 */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STAGGER_MS = 65;
const TICK_MS = 70;

function LetterReel({
  char,
  delay,
  reduced,
}: {
  char: string;
  delay: number;
  reduced: boolean;
}) {
  const [display, setDisplay] = useState(char);

  useEffect(() => {
    if (reduced || char === " ") {
      setDisplay(char);
      return;
    }
    let intervalId: number | undefined;
    let spins = 0;
    const maxSpins = 2 + Math.floor(Math.random() * 3); // 2–4 spins

    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        spins += 1;
        if (spins >= maxSpins) {
          window.clearInterval(intervalId);
          setDisplay(char);
        } else {
          setDisplay(CHARS[(Math.random() * CHARS.length) | 0]);
        }
      }, TICK_MS);
    }, delay);

    return () => {
      window.clearTimeout(startId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [char, delay, reduced]);

  return (
    <span className="inline-block" style={{ minWidth: char === "I" ? "0.4em" : undefined }}>
      {display}
    </span>
  );
}

export default function SlotName({
  wordA,
  wordB,
  side,
  className,
}: {
  wordA: string;
  wordB: string;
  /** controlled cursor side; when provided, the parent owns the swap so the
   *  name stays in sync with sibling UI (side labels). When omitted, the
   *  component runs its own mousemove listener (uncontrolled fallback). */
  side?: "a" | "b";
  className?: string;
}) {
  const [word, setWord] = useState(wordA);
  const [reduced, setReduced] = useState(true); // assume reduced until client confirms
  const sideRef = useRef<"a" | "b">("a");
  const controlled = side !== undefined;

  // detect capability once
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // CONTROLLED: follow the parent's side prop
  useEffect(() => {
    if (!controlled) return;
    setWord(side === "b" ? wordB : wordA);
  }, [controlled, side, wordA, wordB]);

  // UNCONTROLLED: run our own cursor-side listener
  useEffect(() => {
    if (controlled) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // No swap on coarse pointer or reduced motion — keep wordA resolved.
    if (!fine || prefersReduced) return;

    const onMove = (e: MouseEvent) => {
      const next: "a" | "b" = e.clientX < window.innerWidth / 2 ? "a" : "b";
      if (next !== sideRef.current) {
        sideRef.current = next;
        setWord(next === "a" ? wordA : wordB);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [controlled, wordA, wordB]);

  const letters = word.split("");

  return (
    <span className={className} aria-hidden>
      {letters.map((ch, i) => (
        <LetterReel key={i} char={ch} delay={i * STAGGER_MS} reduced={reduced} />
      ))}
    </span>
  );
}
