# Pranav Patidar — Portfolio

A flashy, single-page developer portfolio reframed as a **retro-broadcast / CRT
experience**: a terminal boot sequence hands off to a bright editorial stage rendered
"inside a picture tube," with a WebGL fluid backdrop that wipes a colour portrait into
view along the cursor trail. Navigation is a diegetic **channel tuner** — each section is
a channel you tune to.

**Live:** https://pranavpatidar.in

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@theme` tokens, no config file)
- **Motion** (Framer) for animation, **Lenis** for smooth scroll
- A framework-agnostic **WebGL fluid simulation** (`lib/fluid/`), gated by a device-
  capability probe so weak GPUs / reduced-motion get a static fallback
- **Resend** for the contact form
- Deployed on **Vercel**

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in RESEND_API_KEY
npm run dev                  # http://localhost:3000
```

Append `?lite` to the URL to force the 2D fallback, or `?full` to force the full WebGL tier.

### Environment variables

The contact form posts to a Route Handler (`app/api/contact/route.ts`) that sends mail via
Resend. See `.env.example`:

| Variable         | Required | Notes                                                            |
| ---------------- | -------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY` | yes      | From [resend.com](https://resend.com).                           |
| `CONTACT_FROM`   | no       | Verified sender; falls back to Resend's onboarding address.      |

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

## Architecture notes

- **`lib/content.ts`** — single source of truth for profile, projects, skills, nav zones,
  and the canonical `siteUrl`.
- **`lib/tuner-context.tsx`** — the channel-tuner state (scrollspy-driven active channel,
  hover, glitch). Deliberately separate from `lib/scroll-context.tsx` so hover never thrashes
  scroll consumers.
- **`components/fx/`** — the CRT/WebGL effect layer; every effect self-gates on touch /
  reduced-motion.
- **`components/sections/`** — Hero, Work, About, Skills, Contact and their case-study UI.

## Deploy

Push to a Git remote and import the repo on Vercel. Set `RESEND_API_KEY` (and optionally
`CONTACT_FROM`) in the project's environment variables. The default framework preset builds
and serves with no extra config.
