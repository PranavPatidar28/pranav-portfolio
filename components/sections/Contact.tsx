"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { profile } from "@/lib/content";
import { Reveal, RevealWords } from "@/components/Reveal";
import ChannelSlate from "./ChannelSlate";

// Faint CRT scanline — same values used site-wide (Skills/Work/About).
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

export default function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  // honeypot — real users leave it empty; bots tend to fill every field.
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    company: "",
  });
  const [copied, setCopied] = useState(false);
  const successRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the success heading so screen-reader + keyboard users
  // are taken to the confirmation when the form is replaced.
  useEffect(() => {
    if (state === "sent") successRef.current?.focus();
  }, [state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || "Could not send your message. Please try again."
        );
      }
      setState("sent");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please try again."
      );
      setState("error");
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the address is visible anyway
    }
  }

  return (
    <section
      id="contact"
      className="relative px-6 py-32 sm:px-8 md:px-16 md:py-40"
    >
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <ChannelSlate
            channel={4}
            title="Contact"
            status="Open channel"
            titleSize="clamp(3.25rem, 7vw, 6rem)"
            className="mb-6"
          />
          <h2 className="font-condensed text-3xl leading-[0.95] text-ink sm:text-4xl">
            <RevealWords text="Let's build" />
            <br />
            <RevealWords text="something." delay={0.1} />
          </h2>

          <Reveal delay={0.3}>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-ink-soft">
              Open to internships, full-time roles, and freelance gigs. The
              fastest way to reach me is below.
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 space-y-4">
              <ContactLink
                label="Email"
                value={profile.email}
                href={`mailto:${profile.email}`}
              />
              <ContactLink
                label="GitHub"
                value="@pranavpatidar28"
                href={profile.socials.github}
              />
              <ContactLink
                label="LinkedIn"
                value="Pranav Patidar"
                href={profile.socials.linkedin}
              />
            </div>
          </Reveal>
        </div>

        {/* form */}
        <div className="md:col-span-7">
          <Reveal delay={0.2}>
            {state === "sent" ? (
              <div
                className="flex h-full min-h-64 flex-col items-start justify-center border border-line bg-bg-raised p-10"
                role="status"
                aria-live="polite"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-clay text-bg-raised">
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path d="M3 9.5l4 4 8-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
                <p
                  ref={successRef}
                  tabIndex={-1}
                  className="mt-5 font-condensed text-3xl text-ink outline-none"
                >
                  Message sent.
                </p>
                <p className="mt-2 text-ink-soft">
                  Thanks for reaching out — I&apos;ll get back to you soon.
                </p>
                <button
                  onClick={copyEmail}
                  aria-label={
                    copied ? "Email address copied" : "Copy email address"
                  }
                  className="mt-5 flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-clay hover:text-clay-deep"
                >
                  {copied ? "Copied ✓" : profile.email}
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-sm bg-bg-raised p-7 shadow-soft sm:p-9">
                {/* shared CRT surface texture + bezel — bright, like Skills' rack */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{ backgroundImage: SCANLINE }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-line"
                />
                <div className="relative mb-6 flex items-center justify-between border-b border-line-soft pb-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-faint">
                  <span>Transmission</span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]" />
                    Ready
                  </span>
                </div>
                <form onSubmit={handleSubmit} className="relative space-y-6">
                  <Field
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                    required
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    required
                  />
                  <Field
                    label="Message"
                    name="message"
                    textarea
                    value={form.message}
                    onChange={(v) => setForm({ ...form, message: v })}
                    required
                  />

                  {/* honeypot — hidden from humans, catches naive bots. Off the
                      a11y tree and out of the tab order. */}
                  <div aria-hidden className="hidden">
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                    />
                  </div>

                  {state === "error" && (
                    <p
                      role="alert"
                      className="font-mono text-sm text-clay-deep"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={state === "sending"}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full overflow-hidden rounded-full bg-ink px-7 py-4 text-sm font-medium text-bg-raised disabled:opacity-60 sm:w-auto sm:px-10"
                  >
                    <span className="relative z-10">
                      {state === "sending"
                        ? "Sending…"
                        : state === "error"
                          ? "Try again"
                          : "Send message"}
                    </span>
                    <span className="absolute inset-0 z-0 translate-y-full bg-clay transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
                  </motion.button>
                </form>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactLink({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="group flex items-center justify-between border-b border-line py-3"
    >
      <span className="flex items-center gap-2.5">
        {/* signal-strength bars — fill to "full signal" on hover */}
        <span
          aria-hidden
          className="flex items-end gap-[2px]"
          style={{ height: 12 }}
        >
          {[4, 7, 10].map((h, i) => (
            <span
              key={i}
              className="sig-bar transition-colors group-hover:!bg-[var(--color-signal-bright)] group-hover:!opacity-100"
              style={{ height: h }}
            />
          ))}
        </span>
        <span className="font-terminal text-sm uppercase tracking-[0.12em] text-ink-faint">
          {label}
        </span>
      </span>
      <span className="flex items-center gap-2 text-ink transition-colors group-hover:text-clay-deep">
        {value}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100">
          <path d="M3 9l6-6M9 3H4.5M9 3v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  textarea = false,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const base =
    "peer w-full border-b border-line bg-transparent py-3 text-ink outline-none transition-colors placeholder-transparent focus:border-clay";
  return (
    <div className="relative">
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={4}
          placeholder={label}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={label}
          className={base}
        />
      )}
      <label
        htmlFor={name}
        className="pointer-events-none absolute left-0 top-3 font-terminal text-sm uppercase tracking-[0.12em] text-ink-faint transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:text-clay peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
