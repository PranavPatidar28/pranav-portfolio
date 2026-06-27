"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { Project } from "@/lib/content";
import ProjectVisual from "./ProjectVisual";

/* ============================================================
   WORK HOVER PREVIEW
   A floating "broadcast monitor" that tunes in to whatever project
   row the cursor is over. The card lerp-trails the pointer (same feel
   as the custom cursor's ring), crossfades when you move between rows,
   and clamps to the viewport so it never spills off-screen.

   Fine-pointer only. Touch devices never mount it (they tap straight
   into the case study); reduced-motion users get an instant snap with
   no trailing and no entrance scale.
   ============================================================ */

const CARD_W = 340;
const ASPECT = 3 / 2;
const CARD_H = Math.round(CARD_W / ASPECT);
const OFFSET = 28;
const EASE_FOLLOW = 0.18;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function WorkHoverPreview({
  project,
  index,
}: {
  project: Project | null;
  index: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Capability resolved on the client; default false so SSR/touch render nothing.
  const [enabled, setEnabled] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    reducedRef.current = reduced;
    setEnabled(fine);
  }, []);

  // rAF follow loop — writes transform straight to the node so pointer moves
  // never trigger React renders. Mirrors CustomCursor's approach.
  useEffect(() => {
    if (!enabled) return;
    const node = wrapRef.current;
    if (!node) return;

    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let cx = px;
    let cy = py;
    let primed = false; // jump to the cursor on first move (no slide-in from center)

    function place(x: number, y: number) {
      // default to the right of the cursor; flip left near the right edge
      let left = x + OFFSET;
      if (left + CARD_W > window.innerWidth - 8) left = x - OFFSET - CARD_W;
      left = Math.max(8, left);
      // vertically centered on the cursor, clamped to the viewport
      let top = y - CARD_H / 2;
      top = Math.max(8, Math.min(top, window.innerHeight - CARD_H - 8));
      node!.style.transform = `translate(${left}px, ${top}px)`;
    }

    function onMove(e: MouseEvent) {
      px = e.clientX;
      py = e.clientY;
      if (!primed || reducedRef.current) {
        primed = true;
        cx = px;
        cy = py;
        place(cx, cy);
      }
    }

    let raf = 0;
    function loop() {
      if (!reducedRef.current) {
        cx += (px - cx) * EASE_FOLLOW;
        cy += (py - cy) * EASE_FOLLOW;
        place(cx, cy);
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [enabled]);

  if (!enabled) return null;

  const open = project !== null;

  return createPortal(
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] will-change-transform"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <AnimatePresence mode="popLayout">
        {open && (
          <motion.div
            key={project.slug}
            className="absolute inset-0 overflow-hidden rounded-md shadow-lift"
            initial={
              reducedRef.current
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reducedRef.current
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: -8 }
            }
            transition={{ duration: 0.32, ease: EASE }}
          >
            <ProjectVisual project={project} variant="card" index={index + 1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
