"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { projects, type Project } from "@/lib/content";
import { useScrollProgress } from "@/lib/scroll-context";
import ProjectVisual from "./ProjectVisual";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CaseStudy({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { lenis } = useScrollProgress();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Portal target is only available on the client. Render nothing until mount
  // so SSR markup matches and createPortal never touches a missing document.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Scroll lock, Escape to close, focus trap, background inert,
  // and focus restoration on close.
  useEffect(() => {
    if (!project) return;

    // remember what to return focus to
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    lenis?.stop();
    document.body.style.overflow = "hidden";

    // hide the rest of the page from AT + tab order
    const main = document.getElementById("main");
    main?.setAttribute("inert", "");
    main?.setAttribute("aria-hidden", "true");

    // move focus into the dialog
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(focusTimer);
      lenis?.start();
      document.body.style.overflow = "";
      main?.removeAttribute("inert");
      main?.removeAttribute("aria-hidden");
      window.removeEventListener("keydown", onKey);
      // Restore focus to where it was, falling back to #main if that element
      // is gone from the DOM (so focus never gets stranded on <body>).
      const target = restoreFocusRef.current;
      if (target?.isConnected) {
        target.focus();
      } else {
        document.getElementById("main")?.focus();
      }
    };
  }, [project, lenis, onClose]);

  const channel =
    project !== null
      ? projects.findIndex((p) => p.slug === project.slug) + 1
      : 0;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[52] flex items-center justify-center p-4 sm:p-10 md:p-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} case study`}
        >
          {/* scrim — dims the rest of the screen but stays UNDER the CRT chrome,
              so the whole composition still reads as one picture tube. */}
          <button
            className="absolute inset-0 bg-boot/55 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Close case study"
            tabIndex={-1}
          />

          {/* CHANNEL CARD — a centered, inset panel that lives inside the tube.
              Kept within the flat screen area (note the container padding) so the
              curved bezel never clips its corners or the Close button. The CRT
              scanlines / grain / vignette layer over it from z-55+, unifying it
              with the rest of the broadcast. */}
          <motion.article
            ref={panelRef}
            className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-bg-raised shadow-lift"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {/* fixed chrome — reads like a broadcast equipment header. Pinned
                outside the scroll region so Close is always reachable. */}
            <div className="flex shrink-0 items-center justify-between border-b border-line bg-bg-raised px-6 py-4 sm:px-8 sm:py-5">
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]" />
                REC&nbsp;·&nbsp;CH&nbsp;{String(channel).padStart(2, "0")}
              </span>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="group flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-clay-deep"
              >
                Close
                <span className="grid h-7 w-7 place-items-center rounded-full border border-line transition-colors group-hover:border-clay">
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>

            {/* scroll region — hero + body scroll within the card. Native
                scroll: data-lenis-prevent stops Lenis from swallowing wheel
                events here, and .no-scrollbar hides the bar. */}
            <div
              data-lenis-prevent
              className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
            {/* HERO BAND — the tuned-in monitor, with the title + metadata
                overlaid on a bottom scrim so it reads over a screenshot too. */}
            <motion.div
              className="relative aspect-[16/9] w-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
            >
              <ProjectVisual project={project} variant="hero" index={channel} />
              {/* readability scrim for the overlaid title */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-boot via-boot/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="font-terminal text-base uppercase tracking-[0.2em] text-amber-soft">
                  {project.year} · {project.domain}
                </p>
                <h2 className="mt-1 font-condensed text-5xl leading-[0.85] text-bg-raised sm:text-6xl">
                  {project.title}
                </h2>
              </div>
            </motion.div>

            {/* CONTENT */}
            <motion.div
              className="px-8 py-10 sm:px-12"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
              }}
            >
              <Stagger>
                <p className="text-lg text-ink-soft">{project.subtitle}</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-wider text-clay">
                  {project.role}
                </p>
              </Stagger>

              {/* links */}
              <Stagger>
                <div className="mt-7 flex flex-wrap gap-3">
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open the live demo for ${project.title} (opens in a new tab)`}
                      className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-bg-raised transition-opacity hover:opacity-90"
                    >
                      Live demo
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                        <path d="M3 9l6-6M9 3H4.5M9 3v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                  {project.links.repo && (
                    <a
                      href={project.links.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View the source code for ${project.title} on GitHub (opens in a new tab)`}
                      className="flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink"
                    >
                      Source
                    </a>
                  )}
                </div>
              </Stagger>

              <Stagger>
                <Divider label="The problem" />
                <p className="text-[0.98rem] leading-relaxed text-ink-soft">
                  {project.problem}
                </p>
              </Stagger>

              <Stagger>
                <Divider label="The approach" />
                <p className="text-[0.98rem] leading-relaxed text-ink-soft">
                  {project.approach}
                </p>
              </Stagger>

              <Stagger>
                <Divider label="Highlights" />
                <ul className="space-y-3">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-[0.98rem] leading-relaxed text-ink-soft">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-clay" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Stagger>

              <Stagger>
                <Divider label="Built with" />
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-line bg-bg px-3 py-1.5 font-mono text-xs text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Stagger>
            </motion.div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-4">
      <span className="eyebrow whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
