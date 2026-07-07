"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ABOUT_ME_ASCII } from "@/lib/aboutArt";
import SectionHeading from "./SectionHeading";

// Noise alphabet matches the two characters the real art is built from
// (see lib/aboutArt.ts), so the scramble reads as "static" from the same
// font/weight rather than random unrelated glyphs.
const SCRAMBLE_CHARS = ["#", " "];
const SCRAMBLE_DURATION_MS = 800;
// Redraw the noise on an interval slower than 60fps to keep the ~53k-char
// rebuild cheap; still reads as smooth motion at this duration.
const SCRAMBLE_FRAME_INTERVAL_MS = 40;

const COLOR_SCHEMES = [
  {
    id: "bw",
    label: "Black & white",
    text: "text-white/85",
    bg: "",
    swatch: "bg-white",
  },
  {
    id: "amber",
    label: "Amber",
    text: "text-term-yellow/90",
    bg: "",
    swatch: "bg-term-yellow",
  },
  {
    id: "inverted",
    label: "Inverted",
    text: "text-black/85",
    bg: "bg-white",
    swatch: "bg-black ring-1 ring-inset ring-white/40",
  },
] as const;

type SchemeId = (typeof COLOR_SCHEMES)[number]["id"];

export default function AboutMe({ name }: { name: string }) {
  const firstName = name.split(" ")[0];
  const [scheme, setScheme] = useState<SchemeId>("bw");
  const active = COLOR_SCHEMES.find((s) => s.id === scheme) ?? COLOR_SCHEMES[0];

  const [displayArt, setDisplayArt] = useState(ABOUT_ME_ASCII);
  const hasScrambledRef = useRef(false);
  const frameRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const runScramble = () => {
    if (hasScrambledRef.current) return;
    hasScrambledRef.current = true;

    const finalArt = ABOUT_ME_ASCII;
    const len = finalArt.length;
    // Each character locks into its final value at its own random moment
    // within the window, so the image resolves as a wave of noise settling
    // rather than a single uniform fade.
    const revealAt = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      revealAt[i] = finalArt[i] === "\n" ? 0 : Math.random() * SCRAMBLE_DURATION_MS;
    }

    const start = performance.now();
    let lastRender = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= SCRAMBLE_DURATION_MS) {
        setDisplayArt(finalArt);
        frameRef.current = undefined;
        return;
      }
      if (now - lastRender >= SCRAMBLE_FRAME_INTERVAL_MS) {
        lastRender = now;
        const out = new Array(len);
        for (let i = 0; i < len; i++) {
          const ch = finalArt[i];
          out[i] =
            ch === "\n" || elapsed >= revealAt[i]
              ? ch
              : SCRAMBLE_CHARS[Math.random() < 0.5 ? 0 : 1];
        }
        setDisplayArt(out.join(""));
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  return (
    <section id="about" className="relative py-28">
      <div className="container-page">
        <SectionHeading eyebrow="$ cat about.txt" title="About Me" />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            onViewportEnter={runScramble}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="glass mx-auto w-full max-w-[520px] overflow-hidden rounded-xl shadow-glass"
          >
            <div className="flex items-center gap-1.5 border-b border-bg-border px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-term-red/70" />
              <span className="h-3 w-3 rounded-full bg-term-yellow/70" />
              <span className="h-3 w-3 rounded-full bg-term-green/70" />
              <span className="ml-3 font-mono text-xs text-term-muted">portrait.ascii</span>
            </div>
            <div className="flex items-stretch">
              <pre
                className={`select-none overflow-x-auto p-5 text-left font-mono text-[1.6px] leading-[1.8px] transition-colors duration-300 sm:text-[2px] sm:leading-[2.2px] ${active.bg} ${active.text}`}
              >
                {displayArt}
              </pre>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 border-l border-bg-border px-4">
                {COLOR_SCHEMES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScheme(s.id)}
                    aria-label={`${s.label} colour scheme`}
                    title={s.label}
                    className={`h-4 w-4 shrink-0 rounded-full transition-all ${s.swatch} ${
                      scheme === s.id
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-bg-panel"
                        : "opacity-50 hover:opacity-90"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <p className="font-mono text-sm text-accent-bright">Hi, I&apos;m {firstName} 👋</p>
            <p className="mt-4 text-base leading-relaxed text-term-muted">
              I&apos;m a software engineering student who likes taking systems apart to see how
              they actually work, then rebuilding the parts that annoy me. Most of my time goes
              into backend systems, data pipelines, and the occasional AI agent that automates
              away the boring parts of a job.
            </p>
            <p className="mt-4 text-base leading-relaxed text-term-muted">
              Outside of internships and coursework, I&apos;m usually deep in a side project,
              tuning a home lab, or arguing with a config file until it does what I meant instead
              of what I typed. I care a lot about tools that feel good to use, this site included.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
