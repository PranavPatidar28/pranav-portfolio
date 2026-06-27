"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay: i * 0.08 },
  }),
};

/** A line of text that masks-reveals upward, the classic editorial move. */
export function RevealText({
  children,
  className = "",
  delay = 0,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "span" | "div" | "p" | "h1" | "h2";
}) {
  const MotionTag = motion[Tag];
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <MotionTag
        className={`inline-block ${className}`}
        data-reveal
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </MotionTag>
    </span>
  );
}

/** Generic reveal-on-scroll wrapper. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      data-reveal
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Splits a string into words and reveals them in sequence. */
export function RevealWords({
  text,
  className = "",
  wordClassName = "",
  stagger = 0.05,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  stagger?: number;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={`inline-block ${wordClassName}`}
            data-reveal
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: EASE, delay: delay + i * stagger }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
      </span>
    </span>
  );
}
