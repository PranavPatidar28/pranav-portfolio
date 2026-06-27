"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { projects, type Project } from "@/lib/content";
import ChannelSlate from "./ChannelSlate";
import CaseStudy from "./CaseStudy";
import WorkHoverPreview from "./WorkHoverPreview";

// Faint CRT scanline — identical values to Skills/About/ProjectVisual so the
// whole site reads as the same broadcast system. Static => reduced-motion safe.
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

export default function Work() {
  const [active, setActive] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const setHover = useCallback((slug: string | null) => {
    setHovered(slug);
  }, []);

  const open = useCallback((project: Project) => {
    setActive(project);
  }, []);

  const close = useCallback(() => {
    setActive(null);
  }, []);

  // Resolve the hovered slug to its project + position for the floating preview.
  const hoveredIndex = hovered
    ? projects.findIndex((p) => p.slug === hovered)
    : -1;
  const hoveredProject = hoveredIndex >= 0 ? projects[hoveredIndex] : null;

  return (
    <section id="work" className="relative px-6 py-32 sm:px-8 md:px-16 md:py-44">
      {/* Station banner — announces this section's tuner channel (CH 02) */}
      <ChannelSlate
        channel={1}
        title="Projects"
        status="Program guide"
        meta={`${String(projects.length).padStart(2, "0")} channels`}
      />

      <ul className="border-t border-line">
        {projects.map((project, i) => {
          const dim = hovered !== null && hovered !== project.slug;
          return (
            <motion.li
              key={project.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
              className="group/row relative border-b border-line"
              onMouseEnter={() => setHover(project.slug)}
              onMouseLeave={() => setHover(null)}
            >
              {/* faint CRT scanline surface — sinks in on hover, like a tuned
                  channel coming into signal. pointer-events-none so the row
                  button still owns all interaction. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/row:opacity-50"
                style={{ backgroundImage: SCANLINE }}
              />
              <button
                onClick={() => open(project)}
                data-cursor="grow"
                className="group relative flex w-full items-center gap-4 py-7 text-left transition-opacity duration-300 active:bg-bg-sunk sm:grid sm:grid-cols-12 sm:py-9"
                style={{ opacity: dim ? 0.4 : 1 }}
                aria-label={`Open ${project.title} case study`}
              >
                {/* index — terminal channel numerals */}
                <span className="shrink-0 self-start pt-1 font-terminal text-lg leading-none text-ink-faint sm:col-span-1 sm:self-center sm:pt-0">
                  CH{String(i + 1).padStart(2, "0")}
                </span>

                {/* title + subtitle + domain */}
                <span className="min-w-0 flex-1 sm:col-span-6">
                  <span className="flex items-baseline gap-3">
                    <span className="text-2xl font-semibold tracking-tight text-ink transition-colors duration-300 group-hover:text-clay-deep sm:text-3xl">
                      {project.title}
                    </span>
                    {project.featured && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {project.blurb}
                  </span>
                  {/* domain inline on mobile */}
                  <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-wider text-ink-faint sm:hidden">
                    {project.domain}
                  </span>
                </span>

                {/* domain — desktop column */}
                <span className="hidden font-mono text-[0.7rem] uppercase tracking-wider text-ink-faint sm:col-span-3 sm:block">
                  {project.domain}
                </span>

                {/* arrow — shown on all viewports */}
                <span className="flex shrink-0 justify-end sm:col-span-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-line transition-all duration-300 group-hover:border-clay group-hover:bg-clay">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                      className="text-ink transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-bg-raised"
                    >
                      <path
                        d="M3 11L11 3M11 3H5M11 3v6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <CaseStudy project={active} onClose={close} />

      <WorkHoverPreview
        project={hoveredProject}
        index={hoveredIndex}
      />
    </section>
  );
}
