"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { projects, type Project } from "@/lib/content";
import ChannelSlate from "./ChannelSlate";
import CaseStudy from "./CaseStudy";
import ProjectVisual from "./ProjectVisual";
import WorkHoverPreview from "./WorkHoverPreview";

// Faint CRT scanline — identical values to Skills/About/ProjectVisual so the
// whole site reads as the same broadcast system. Static => reduced-motion safe.
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

// Keep the front page curated. The full archive remains directly below, while
// these three projects get enough visual space to communicate the product
// before a visitor opens the case study.
const FEATURED_SLUGS = new Set(["smartdeck", "intellivault", "intellifarm"]);
const featuredProjects = projects.filter((project) =>
  FEATURED_SLUGS.has(project.slug)
);
const featuredSlugs = new Set(featuredProjects.map((project) => project.slug));
const archiveProjects = projects.filter((project) => !featuredSlugs.has(project.slug));

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 h-[48rem] opacity-70"
        style={{
          background:
            "radial-gradient(55% 46% at 28% 38%, rgba(189,91,60,0.09), transparent 72%), radial-gradient(45% 40% at 78% 58%, rgba(29,78,216,0.055), transparent 74%)",
        }}
      />
      {/* Station banner — announces this section's tuner channel (CH 02) */}
      <ChannelSlate
        channel={1}
        title="Projects"
        status="Program guide"
        meta={`${String(projects.length).padStart(2, "0")} channels`}
      />

      <div className="mb-20 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
        {featuredProjects.map((project, i) => (
          <FeaturedBroadcast
            key={project.slug}
            project={project}
            index={projects.indexOf(project)}
            primary={i === 0}
            onOpen={open}
          />
        ))}
      </div>

      <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
        <div>
          <p className="eyebrow text-clay-deep">Archive deck</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            More transmissions
          </h3>
        </div>
        <span className="font-terminal text-base text-ink-faint">
          {String(archiveProjects.length).padStart(2, "0")} recordings
        </span>
      </div>

      <ul>
        {archiveProjects.map((project, archiveIndex) => {
          const i = projects.indexOf(project);
          const dim = hovered !== null && hovered !== project.slug;
          return (
            <motion.li
              key={project.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
                delay: archiveIndex * 0.06,
              }}
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

function FeaturedBroadcast({
  project,
  index,
  primary,
  onOpen,
}: {
  project: Project;
  index: number;
  primary: boolean;
  onOpen: (project: Project) => void;
}) {
  const channel = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={
        primary
          ? "group/broadcast lg:col-span-7 lg:row-span-2"
          : "group/broadcast lg:col-span-5"
      }
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        aria-label={`Open featured ${project.title} case study`}
        data-cursor="grow"
        className="broadcast-card relative flex h-full w-full flex-col overflow-hidden rounded-sm border border-line bg-bg-raised text-left shadow-soft transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-clay/60 hover:shadow-lift focus-visible:-translate-y-1 focus-visible:border-clay"
      >
        <div className="signal-window relative block w-full overflow-hidden bg-boot">
          <div
            className={`block w-full ${primary ? "aspect-[16/11] lg:aspect-auto lg:h-[28rem]" : "aspect-[16/7] lg:aspect-auto lg:h-[12rem]"}`}
          >
            <ProjectVisual
              project={project}
              variant={primary ? "hero" : "card"}
              index={index + 1}
            />
          </div>
          <span className="signal-lock pointer-events-none absolute inset-x-0 top-1/2 h-px bg-amber-soft opacity-0 shadow-[0_0_12px_var(--color-amber)]" />
        </div>

        <span className={`flex flex-1 flex-col ${primary ? "p-6 sm:p-8" : "p-5 sm:p-6"}`}>
          <span className="mb-4 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-faint">
            <span>Featured transmission · CH {channel}</span>
            <span>{project.year}</span>
          </span>

          <span className="flex items-start justify-between gap-5">
            <span>
              <span
                className={`block font-condensed leading-[0.86] text-ink transition-colors duration-300 group-hover/broadcast:text-clay-deep ${
                  primary ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
                }`}
              >
                {project.title}
              </span>
              <span className="mt-2 block max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                {primary ? project.blurb : project.subtitle}
              </span>
            </span>

            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line transition-all duration-300 group-hover/broadcast:border-clay group-hover/broadcast:bg-clay group-hover/broadcast:text-bg-raised">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
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

          {primary && (
            <span className="mt-6 flex flex-wrap gap-2">
              {project.stack.slice(0, 6).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line-soft bg-bg px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink-soft"
                >
                  {item}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
    </motion.article>
  );
}
