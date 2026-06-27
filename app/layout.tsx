import type { Metadata } from "next";
import { Barlow_Condensed, Space_Grotesk, VT323, Geist_Mono } from "next/font/google";
import "./globals.css";
import { profile, siteUrl } from "@/lib/content";

// Giant condensed display face — the hero name. Non-variable: needs a weight.
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: "900",
  display: "swap",
});

// UI / labels / body. Variable font.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Terminal / CRT chrome. Non-variable pixel font: needs a weight.
const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Code-flavored labels.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s · ${profile.name}`,
  },
  description: profile.tagline,
  keywords: [
    "Pranav Patidar",
    "Full-Stack Developer",
    "Frontend Developer",
    "NestJS",
    "Next.js",
    "React",
    "TypeScript",
    "Portfolio",
  ],
  authors: [{ name: profile.name, url: profile.socials.github }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${profile.name} — ${profile.role}`,
    description: profile.tagline,
    siteName: `${profile.name} · Portfolio`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.role}`,
    description: profile.tagline,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
};

// Person structured data (JSON-LD) — helps search engines and AI understand
// who this portfolio belongs to. Rendered as a plain <script> in <body>.
// `<` is escaped to its unicode form to neutralise any XSS via interpolated
// strings (per Next.js JSON-LD guidance).
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  url: siteUrl,
  email: `mailto:${profile.email}`,
  sameAs: [profile.socials.github, profile.socials.linkedin],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The inline <head> script below strips `no-js` from this element's
      // className before React hydrates, so the server/client className
      // differs by design. Tell React to keep the DOM and skip the warning.
      suppressHydrationWarning
      className={`${barlow.variable} ${spaceGrotesk.variable} ${vt323.variable} ${geistMono.variable} no-js antialiased`}
    >
      <head>
        {/* Drop the no-js flag the instant JS runs, so the CSS reveal
            fallback only applies when scripts are truly disabled. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.remove('no-js');",
          }}
        />
      </head>
      <body className="grain">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
