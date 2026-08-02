/* ============================================================
   CONTENT — single source of truth.
   Real projects pulled from github.com/pranavpatidar28
   ============================================================ */

// Canonical production origin. Single source for metadataBase, OG/canonical
// URLs, the sitemap and robots — keep it here so those never drift apart.
// No trailing slash.
export const siteUrl = "https://pranavpatidar.in";

export const profile = {
  name: "Pranav Patidar",
  role: "Full-Stack Developer",
  tagline: "I build production-grade web & mobile platforms — from NestJS APIs to real-time, AI-assisted product experiences.",
  location: "India",
  email: "pranavpatidar285@gmail.com",
  socials: {
    github: "https://github.com/pranavpatidar28",
    linkedin: "https://www.linkedin.com/in/pranav-patidar/",
  },
  // Short architectural bio for the About zone.
  bio: [
    "I'm a full-stack developer who likes building the whole thing — the API that holds the truth, the real-time layer that keeps it live, and the interface that makes it feel effortless.",
    "Most of my recent work lives in TypeScript monorepos: NestJS services backed by PostgreSQL and Prisma, Expo mobile clients, WebSocket layers, and AI features grounded in real product data.",
    "I care about software that ships — green builds from a fresh clone, sensible architecture, and details that hold up under real use.",
  ],
} as const;

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  // one-liner shown on the floating panel
  blurb: string;
  // optional screenshot for the hover preview + case-study hero.
  // When absent, a CRT-themed generated card stands in (see ProjectVisual).
  image?: string;
  imagePosition?: string;
  // full case study
  problem: string;
  approach: string;
  highlights: string[];
  stack: string[];
  links: { live?: string; repo?: string };
  // categorisation for the skills/spatial grouping
  domain:
    | "Full-Stack"
    | "Real-Time"
    | "Frontend"
    | "Mobile"
    | "Desktop"
    | "Browser Extension";
  // featured ones float largest in the gallery
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "smartdeck",
    title: "SmartDeck",
    image: "/projects/smartdeck-site-final.png",
    imagePosition: "center top",
    subtitle: "A touch-first control surface for Windows",
    year: "2026",
    role: "Desktop product — app, platform & integrations",
    blurb:
      "An Electron app that turns a tablet or second display into a customizable PC control surface for actions, workflows, and live widgets.",
    problem:
      "Useful PC controls are scattered across keyboard shortcuts, system menus, and single-purpose utilities. I wanted to turn a screen people already own into a flexible command center that stays within reach without requiring dedicated hardware.",
    approach:
      "I built a Windows-first Electron app with a React renderer and a security-focused main-process action engine. Users can assemble full visual pages from resizable actions and live widgets, run confirmation-gated multi-step workflows, control media and system audio through native Windows helpers, and match pages to the app or task in front of them. Validated configuration imports, rotating backups, a permission-aware local plugin platform, and release verification make it a product rather than a dashboard mockup.",
    highlights: [
      "Customizable touch-first pages with resizable actions, widgets, folders, and themes",
      "Native Windows media, volume, hotkey, app, file, URL, and command controls",
      "Multi-step workflows with progress, cancellation, and confirmation gates",
      "Live CPU, memory, audio, and now-playing widgets through a centralized data pipeline",
      "Context-aware page switching plus starter layouts for work, study, media, and streaming",
      "Isolated local plugin workers with explicit trust, permissions, and change re-approval",
    ],
    stack: ["Electron", "React", "TypeScript", "Vite", "Win32/.NET", "Vitest"],
    links: {
      live: "https://smartdeck.site",
      repo: "https://github.com/PranavPatidar28/SmartDeck",
    },
    domain: "Desktop",
    featured: true,
  },
  {
    slug: "intellivault",
    title: "IntelliVault",
    image: "/projects/intellivault-final.png",
    imagePosition: "center top",
    subtitle: "An AI knowledge vault with semantic search",
    year: "2026",
    role: "Full-stack — AI, auth & data",
    blurb:
      "A note vault with a Tiptap editor, Pinecone semantic search, and an AI pipeline that turns raw dumps into structured, auto-tagged notes.",
    problem:
      "Notes apps are easy to start and hard to make useful. I wanted one where finding something doesn't depend on remembering the exact words you wrote — and where dumping in a messy file or transcript produces clean, organized notes on its own.",
    approach:
      "A Next.js full-stack app: Better Auth with Google OAuth, Prisma over PostgreSQL with twelve migrations, and ~50 API routes. AI is the differentiator — Pinecone vector embeddings with chunking power semantic search, and a multi-stage \"AI Dump\" pipeline ingests raw files or text and returns titles, tags, a TL;DR, and action items, using Promise.allSettled so a single failing step degrades gracefully instead of breaking the whole flow.",
    highlights: [
      "Semantic search over note embeddings via Pinecone, with chunking",
      "Multi-stage AI Dump pipeline: raw input → titled, tagged, summarized notes",
      "Better Auth with Google OAuth + email/password",
      "Prisma + PostgreSQL with 12 evolving migrations across ~50 API routes",
      "Tiptap editor with custom audio/video/file/image nodes",
      "Real test suite — Jest + React Testing Library across routes, hooks, and AI utils",
    ],
    stack: ["Next.js", "React 19", "Prisma", "PostgreSQL", "Pinecone", "Better Auth", "TypeScript"],
    links: {
      live: "https://intellivault.vercel.app",
      repo: "https://github.com/pranavpatidar28/intellivault",
    },
    domain: "Full-Stack",
    featured: true,
  },
  {
    slug: "smart-stay",
    title: "SmartStay",
    image: "/projects/smart-stay.png",
    subtitle: "A student accommodation marketplace",
    year: "2025",
    role: "Full-stack — product & platform",
    blurb:
      "A full-stack housing marketplace with OTP auth, an owner dashboard, and 29 API routes — live on Vercel.",
    problem:
      "Students hunting for hostels, PGs, and flats near campus deal with scattered listings and no trust signals. I wanted a real two-sided marketplace: students browse and book verified places, owners list and manage them from a dashboard.",
    approach:
      "A Next.js platform with a Prisma/PostgreSQL data layer behind 29 API routes covering properties, bookings, favorites, reviews, inquiries, notifications, and analytics. Auth uses Better Auth with custom OTP email verification and role-based access separating students from owners, plus production concerns most student projects skip — Zod validation, rate limiting, and CSRF protection.",
    highlights: [
      "Two-sided marketplace: student browse/book + owner dashboard with analytics",
      "OTP email verification and role-based access (student vs owner)",
      "29 API routes with filtering, sorting, and pagination over a Prisma schema",
      "Production hardening: Zod validation, rate limiting, CSRF protection",
      "Live, deployed, and clickable on Vercel",
    ],
    stack: ["Next.js", "React 19", "Prisma", "PostgreSQL", "Better Auth", "TailwindCSS", "TypeScript"],
    links: {
      live: "https://smart-stay-navy.vercel.app",
      repo: "https://github.com/pranavpatidar28/smart-stay",
    },
    domain: "Full-Stack",
    featured: true,
  },
  {
    slug: "intellifarm",
    title: "Intellifarm",
    image: "/projects/intellifarm.png",
    imagePosition: "center top",
    subtitle: "An India-first crop-season copilot for smallholder farmers",
    year: "2026",
    role: "Full-stack — API, mobile, infra",
    blurb:
      "A NestJS + Expo platform with phone-OTP auth, a grounded AI assistant, and IoT pump control.",
    problem:
      "Smallholder farmers juggle weather, crop timing, market prices, disease risk, and government schemes with almost no tooling built for them. I wanted a single copilot that plans the season, answers questions grounded in the farmer's own data, and even acts on the field.",
    approach:
      "I built a monorepo with a NestJS backend as the single source of truth and an Expo mobile client consuming a versioned /v1 REST API. Shared Zod contracts keep the API and client in lockstep. It runs entirely on mock/seeded providers out of the box — no API keys needed to demo — and swaps in live providers via env vars. It ships with Docker, CI, and a one-command local backend, building green from a fresh clone.",
    highlights: [
      "Passwordless phone-OTP auth with JWT in secure HTTP-only cookies",
      "Deterministic rules engine for crop-season planning + timeline",
      "Grounded AI assistant (text + voice) answering from the farmer's own data",
      "Dual-angle photo disease triage with escalation-first logic",
      "ESP32 IoT pump control with two-step, confirmation-gated commands",
      "Location-aware mandi & warehouse discovery with best-price callouts",
    ],
    stack: ["NestJS", "Expo", "PostgreSQL", "Zod", "Turborepo", "Docker", "TypeScript"],
    links: {
      repo: "https://github.com/pranavpatidar28/intellifarm-rebuid",
    },
    domain: "Full-Stack",
    featured: true,
  },
  {
    slug: "mojito",
    title: "Mojito",
    image: "/projects/mojito.png",
    subtitle: "An animated cocktail showcase",
    year: "2025",
    role: "Frontend — motion & craft",
    blurb:
      "A scroll-driven, animation-heavy landing experience focused on frontend polish.",
    problem:
      "A counterweight to my backend work: a piece purely about motion, rhythm, and visual craft on the frontend.",
    approach:
      "A Next.js landing experience built around scroll-driven animation and careful typographic pacing — the kind of motion work that makes a page feel alive without getting in the way.",
    highlights: [
      "Scroll-driven animation sequences",
      "Editorial layout and typographic rhythm",
      "Deployed and live on Vercel",
    ],
    stack: ["Next.js", "GSAP", "TypeScript", "TailwindCSS"],
    links: {
      live: "https://mojito-cocktails-five.vercel.app",
      repo: "https://github.com/pranavpatidar28/mojito-cocktails",
    },
    domain: "Frontend",
  },
  {
    slug: "agroradar",
    title: "AgroRadar",
    subtitle: "Crop-disease detection & live outbreak mapping",
    year: "2026",
    role: "Full-stack — API, real-time, mobile",
    blurb:
      "A NestJS + Prisma platform that detects crop disease and maps outbreaks in real time over Socket.IO.",
    problem:
      "Crop disease spreads faster than word of mouth. Farmers and agronomists need to see outbreaks as they happen across a region, not weeks later in a report.",
    approach:
      "I built a pnpm + Turborepo monorepo: an Expo mobile app for reporting and a NestJS backend with Prisma against a Neon PostgreSQL database. Socket.IO pushes new detections to a live outbreak map. The backend is hardened with Zod env validation, helmet, compression, structured pino logging, and a global validation pipe.",
    highlights: [
      "Real-time outbreak map powered by Socket.IO websockets",
      "Prisma ORM over Neon serverless PostgreSQL",
      "Zustand + TanStack Query split for client/server state on mobile",
      "Production hardening: helmet, compression, structured logging, env validation",
      "Shared strict-mode TypeScript config across the monorepo",
    ],
    stack: ["NestJS", "Prisma", "PostgreSQL", "Socket.IO", "Expo", "Turborepo", "TypeScript"],
    links: {
      repo: "https://github.com/pranavpatidar28/Crop-Disease-detection-and-map",
    },
    domain: "Real-Time",
    featured: true,
  },
  {
    slug: "slopshield",
    title: "SlopShield",
    image: "/projects/slopshield-thumbnail-v3.png",
    subtitle: "A private, explainable filter for noisy social feeds",
    year: "2026",
    role: "Browser extension — product, detection & privacy",
    blurb:
      "A local-first Chrome extension that warns, blurs, folds, or hides low-signal content on X, Reddit, and LinkedIn.",
    problem:
      "Social feeds are increasingly crowded with repetitive, engagement-optimized posts, but black-box authorship detectors are unreliable and give people little control. I wanted a filter that focuses on observable content patterns, explains every decision, and keeps feed data on the user's device.",
    approach:
      "I built a Manifest V3 Chrome extension that incrementally analyzes visible posts with 16 configurable heuristic signals. Each score exposes its contributing reasons, and users choose site-specific thresholds, signal weights, author or keyword rules, and reversible actions ranging from a warning to hiding the post. All analysis runs locally with no account, telemetry, remote classifier, or content upload.",
    highlights: [
      "Explainable 0–100 scoring across 16 configurable content signals",
      "Warn, blur, fold, and hide modes with one-click reveal",
      "Site adapters for X, Reddit, and LinkedIn feeds",
      "Local-only processing with no telemetry, account, or remote AI API",
      "Per-site controls, author and keyword rules, feedback, and settings import/export",
      "Automated tests plus a real-Chrome runtime harness for supported feed surfaces",
    ],
    stack: ["Chrome Extension", "Manifest V3", "React", "TypeScript", "Vite", "Vitest"],
    links: {
      live: "https://github.com/PranavPatidar28/slopshield/releases/latest",
      repo: "https://github.com/PranavPatidar28/slopshield",
    },
    domain: "Browser Extension",
  },
];

/* Capabilities, framed as bands on a broadcast tuner deck.
   - `unit`   = rack/band number (the U-number on the panel)
   - `code`   = short bay code shown in the mono sub-strip
   - `accent` = name of a CSS custom property (globals.css @theme) — the band's
                phosphor colour for its tuning dial, LED and signal bars
   - `freq`   = decorative font-mono frequency readout (e.g. "142.0" → MHz)
   - `items`  = stations on the band; `note` carries an alias/secondary label
   Render lives in components/sections/Skills.tsx. */
export const skills = [
  {
    unit: "01",
    code: "FE",
    label: "Frontend",
    accent: "--color-broadcast-blue",
    freq: "142.0",
    items: [
      { name: "React 19" },
      { name: "Next.js" },
      { name: "TypeScript" },
      { name: "TailwindCSS" },
      { name: "Motion", note: "Framer Motion" },
      { name: "GSAP" },
      { name: "Zustand" },
      { name: "TanStack Query" },
      { name: "Expo", note: "React Native" },
    ],
  },
  {
    unit: "02",
    code: "BE",
    label: "Backend",
    accent: "--color-clay",
    freq: "128.5",
    items: [
      { name: "NestJS" },
      { name: "Node.js" },
      { name: "Bun" },
      { name: "Prisma" },
      { name: "PostgreSQL" },
      { name: "Socket.IO", note: "WebSockets" },
      { name: "REST APIs" },
      { name: "Zod" },
    ],
  },
  {
    unit: "03",
    code: "INF",
    label: "Tooling & Infra",
    accent: "--color-amber",
    freq: "115.3",
    items: [
      { name: "Turborepo" },
      { name: "Docker" },
      { name: "CI/CD" },
      { name: "Vercel" },
      { name: "Neon" },
      { name: "Git" },
    ],
  },
  {
    unit: "04",
    code: "SYS",
    label: "System Design",
    accent: "--color-signal-bright",
    freq: "103.7",
    items: [
      { name: "REST API design" },
      { name: "Multi-tenancy", note: "tenant isolation" },
      { name: "Realtime", note: "Bun + Socket.IO" },
      { name: "Auth & RBAC", note: "JWT" },
      { name: "Caching" },
      { name: "Data modeling", note: "Prisma · Postgres" },
      { name: "Background jobs" },
    ],
  },
  {
    unit: "05",
    code: "AI",
    label: "AI & Automation",
    accent: "--color-clay-soft",
    freq: "96.5",
    items: [
      { name: "LLM APIs", note: "Claude · OpenAI" },
      { name: "Tool calling", note: "function calling" },
      { name: "Voice & chat apps" },
      { name: "Agentic tooling", note: "Claude Code" },
      { name: "RAG", note: "retrieval" },
      { name: "Embeddings", note: "vector search" },
    ],
  },
  {
    unit: "06",
    code: "LAB",
    label: "Homelab & Self-hosting",
    accent: "--color-clay-deep",
    freq: "88.1",
    items: [
      { name: "Debian", note: "home server" },
      { name: "Docker Compose" },
      { name: "Reverse proxy", note: "Nginx" },
      { name: "Self-hosting" },
      { name: "SSH & shell", note: "systemd · cron" },
      { name: "Linux admin" },
    ],
  },
] as const;

export type SkillModule = (typeof skills)[number];
export type SkillItem = SkillModule["items"][number];

// Each zone is a "channel" on the CRT tuner. `accent` is the name of a CSS
// custom property (declared in globals.css @theme) — the lit-channel colour
// for that section's numeral, label and signal bars.
export const navZones = [
  { id: "arrival", label: "Home", accent: "--color-signal-bright" },
  { id: "work", label: "Work", accent: "--color-clay" },
  { id: "about", label: "About", accent: "--color-amber" },
  { id: "skills", label: "Skills", accent: "--color-broadcast-blue" },
  { id: "contact", label: "Contact", accent: "--color-clay-soft" },
] as const;
