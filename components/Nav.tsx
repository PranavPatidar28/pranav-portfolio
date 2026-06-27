"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTuner } from "@/lib/tuner-context";
import { profile } from "@/lib/content";

/**
 * Fixed chrome: wordmark top-left, channel tuner right.
 *
 * The right rail is the site's single, persistent navigation — a CRT "channel
 * tuner". Each section is a channel (CH 01–05); the lit row mirrors the hero's
 * giant "NOW TUNED" readout because both read `focusedChannel` from the tuner
 * context. It also doubles as the scroll-progress indicator (`aria-current`
 * follows the scroll-active channel), so visitors never feel lost — the #1
 * failure mode of immersive sites.
 */
export default function Nav() {
  const { channels, activeChannel, focusedChannel, setHoverChannel, tuneTo, heroDark } =
    useTuner();

  // Mobile menu — the desktop rail is hidden below md, so phones get a
  // hamburger that opens a full-screen channel overlay. Focus is trapped while
  // open and Escape closes it (mirrors the CaseStudy dialog pattern).
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const onMobileTune = useCallback(
    (i: number) => {
      tuneTo(i);
      setMenuOpen(false);
    },
    [tuneTo]
  );

  // Scroll lock + Escape + focus trap + focus restore, while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;

    // Capture the toggle node now (it's always rendered) so the cleanup
    // restores focus to a stable reference, not whatever the ref points at later.
    const toggle = toggleRef.current;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, a[href]")
        ?.focus();
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // return focus to the toggle so keyboard users aren't stranded
      toggle?.focus();
    };
  }, [menuOpen]);

  // The hero "powers on" dark for ~1s, then warms to the bright stage. While
  // it's dark the fixed chrome needs light ink to read; once warmed (and over
  // every bright section) it's dark ink. Driven by the shared heroDark flag so
  // the wordmark/rail flip in lockstep with the hero darkening.
  const restInk = heroDark ? "var(--color-screen-ink)" : "var(--color-ink)";
  const restFaint = heroDark
    ? "color-mix(in srgb, var(--color-screen-ink) 60%, transparent)"
    : "var(--color-ink-faint)";

  return (
    <>
      {/* Wordmark. The CRT bezel sits on top of everything, and its tube
          corners cut in ~14% (curve bulges to ~5.5% on the diagonal). With
          preserveAspectRatio="none" the stretch is per-axis, so we inset the
          corner chrome ~7% of each axis (vw/vh) to keep it inside the bowed
          screen window instead of under the black tube wall. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between px-[9vw] pt-[8vh] pb-6">
        <button
          onClick={() => tuneTo(0)}
          className="pointer-events-auto text-left"
          aria-label="Back to top"
          data-cursor="grow"
        >
          <span
            className="font-condensed text-2xl leading-none transition-colors duration-300"
            style={{ color: restInk }}
          >
            {profile.name.split(" ")[0].toUpperCase()}
            <span className="text-clay">.</span>
          </span>
        </button>

        {/* Mobile menu toggle — only below md, where the rail is hidden. */}
        <button
          ref={toggleRef}
          onClick={() => setMenuOpen((o) => !o)}
          className="pointer-events-auto -mt-1 flex flex-col items-end gap-1.5 p-1 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open channel menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-channel-menu"
          data-cursor="grow"
        >
          <span
            className="block h-px w-6 transition-colors duration-300"
            style={{ background: restInk }}
          />
          <span
            className="block h-px w-6 transition-colors duration-300"
            style={{ background: restInk }}
          />
        </button>
      </header>

      {/* Channel tuner / progress rail — always visible. The hero's giant
          channel numeral is ghosted at rest, so the small rail reads cleanly
          over it. */}
      <nav
        aria-label="Channels"
        className="pointer-events-none fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 sm:right-8 md:block"
      >
        <ul className="flex flex-col items-end gap-3.5">
          {channels.map((zone, i) => {
            const active = i === activeChannel;
            const focused = i === focusedChannel;
            const num = String(i + 1).padStart(2, "0");
            const accent = `var(${zone.accent})`;
            return (
              <li key={zone.id}>
                <button
                  onClick={() => tuneTo(i)}
                  onMouseEnter={() => setHoverChannel(i)}
                  onMouseLeave={() => setHoverChannel(null)}
                  onFocus={() => setHoverChannel(i)}
                  onBlur={() => setHoverChannel(null)}
                  className="pointer-events-auto group flex items-center justify-end gap-2.5"
                  aria-current={active ? "page" : undefined}
                  aria-label={`Channel ${num} — ${zone.label}`}
                  data-cursor="grow"
                >
                  {/* label — fades in on focus/hover */}
                  <span
                    className={`label text-[0.6rem] transition-opacity duration-300 ${
                      focused
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    style={{ color: focused ? accent : restFaint }}
                  >
                    {zone.label}
                  </span>

                  {/* channel number — takes the channel accent when lit */}
                  <span
                    className="font-mono text-[0.62rem] tabular-nums tracking-[0.12em] transition-colors duration-300"
                    style={{
                      color: focused ? accent : restFaint,
                    }}
                  >
                    CH {num}
                  </span>

                  {/* signal-strength bars */}
                  <SignalBars lit={focused} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile channel overlay — md:hidden. Full-screen list of channels;
          focus-trapped + Escape-closable via the effect above. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-channel-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Channels"
            className="fixed inset-0 z-[60] flex flex-col bg-boot/95 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* header row — label + close */}
            <div className="flex items-center justify-between px-[9vw] pt-[8vh] pb-6">
              <span className="font-terminal text-sm uppercase tracking-[0.3em] text-screen-ink/70">
                Select channel
              </span>
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center text-screen-ink"
                data-cursor="grow"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path
                    d="M2 2l14 14M16 2L2 16"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* channel list */}
            <ul className="flex flex-1 flex-col justify-center gap-2 px-[9vw] pb-[12vh]">
              {channels.map((zone, i) => {
                const active = i === activeChannel;
                const num = String(i + 1).padStart(2, "0");
                const accent = `var(${zone.accent})`;
                return (
                  <li key={zone.id}>
                    <button
                      onClick={() => onMobileTune(i)}
                      aria-current={active ? "page" : undefined}
                      className="group flex w-full items-center gap-4 border-b border-screen-ink/10 py-4 text-left"
                      data-cursor="grow"
                    >
                      <span
                        className="font-mono text-xs tabular-nums tracking-[0.15em]"
                        style={{ color: active ? accent : "var(--color-screen-ink)" }}
                      >
                        CH {num}
                      </span>
                      <span
                        className="font-condensed text-4xl leading-none transition-colors"
                        style={{ color: active ? accent : "var(--color-screen-ink)" }}
                      >
                        {zone.label}
                      </span>
                      {active && (
                        <span
                          aria-hidden
                          className="ml-auto h-2 w-2 rounded-full"
                          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Four ascending signal-strength bars. All light when the channel is tuned;
 *  the tallest "peak" bar flickers (disabled under reduced-motion via CSS). */
function SignalBars({ lit }: { lit: boolean }) {
  const heights = [5, 8, 11, 14];
  return (
    <span aria-hidden className="flex items-end gap-[2px]" style={{ height: 14 }}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={`sig-bar${lit ? " lit" : ""}${
            lit && i === heights.length - 1 ? " peak" : ""
          }`}
          style={{ height: h }}
        />
      ))}
    </span>
  );
}
