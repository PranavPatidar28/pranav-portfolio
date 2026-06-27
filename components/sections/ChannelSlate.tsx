"use client";

import { Reveal } from "@/components/Reveal";
import { navZones } from "@/lib/content";

/* ============================================================
   CHANNEL SLATE
   A broadcast-style section header that announces the section's
   TUNER CHANNEL — the same CH 0X the right-rail tuner lights when
   this section is centred. Leads with a font-terminal channel badge
   + pulsing signal dot + status line, then the giant condensed
   wordmark and an optional right-aligned meta readout.

   A diegetic superset of SectionBanner, used by the sections that
   were previously plain editorial (Work, Contact). Skills/About keep
   their own already-themed chrome.
   ============================================================ */

export default function ChannelSlate({
  channel,
  title,
  status,
  meta,
  titleSize = "var(--text-name)",
  className = "mb-16",
}: {
  /** 0-based index into navZones — derives the CH number + label */
  channel: number;
  title: string;
  /** trailing status text on the slate line, e.g. "Program guide" */
  status?: string;
  /** optional right-aligned readout, e.g. "05 channels" */
  meta?: string;
  titleSize?: string;
  className?: string;
}) {
  const num = String(channel + 1).padStart(2, "0");
  const label = navZones[channel]?.label ?? "";

  return (
    <div className={className}>
      <Reveal>
        <p className="flex items-center gap-2.5">
          {/* channel badge — terminal numerals in a hairline cell */}
          <span className="flex items-center gap-1.5 border border-line px-1.5 py-0.5 font-terminal text-sm leading-none text-ink">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]"
            />
            CH {num}
          </span>
          {/* label + status, broadcast-label tracking */}
          <span className="label text-[0.62rem] text-ink-faint">
            {label}
            {status ? ` · ${status}` : ""}
          </span>
        </p>
      </Reveal>
      <div className="mt-3 flex items-end justify-between gap-6">
        <Reveal>
          <h2
            className="font-condensed leading-[0.82] text-ink"
            style={{ fontSize: titleSize }}
          >
            {title}
          </h2>
        </Reveal>
        {meta && (
          <Reveal delay={0.2}>
            <span className="mb-2 hidden whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-ink-faint sm:block">
              {meta}
            </span>
          </Reveal>
        )}
      </div>
    </div>
  );
}
