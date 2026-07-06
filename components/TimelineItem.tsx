"use client";

import { motion } from "framer-motion";
import type { WorkExperience } from "@/lib/types";
import { withAlpha } from "@/lib/color";

function formatDate(d: string): string {
  if (d.toLowerCase() === "present") return "Present";
  const [year, month] = d.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function TimelineItem({
  job,
  index,
  color,
  isActive,
}: {
  job: WorkExperience;
  index: number;
  color: string;
  isActive: boolean;
}) {
  const isRight = index % 2 === 1;
  const isCurrent = job.date_end.toLowerCase() === "present";

  return (
    <div className="relative pl-12 md:grid md:grid-cols-2 md:gap-10 md:pl-0">
      {/* Node — positioning lives on this plain div so Framer Motion's own
          transform (used below for the scale animation) can't clobber the
          centering translate; inline styles always beat CSS classes for the
          same property, and motion.div writes transform inline. */}
      <div className="absolute left-4 top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 md:left-1/2">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${withAlpha(color, 0.7)}` }}
          className="h-3.5 w-3.5 rounded-full border-2 border-bg transition-colors duration-500"
        />
      </div>

      <div className={`hidden md:block ${isRight ? "order-1" : "order-2"}`} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          borderColor: withAlpha(color, isActive ? 0.9 : 0.35),
          boxShadow: isActive
            ? `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${withAlpha(color, 0.5)}, 0 0 40px ${withAlpha(
                color,
                0.45
              )}`
            : "0 8px 32px rgba(0,0,0,0.45)",
        }}
        className={`glass rounded-xl p-6 transition-[box-shadow,border-color] duration-500 ${
          isRight ? "order-2 md:text-right" : "order-1"
        }`}
      >
        <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${isRight ? "md:justify-end" : ""}`}>
          <h3 className="text-lg font-semibold text-white">{job.title}</h3>
          {isCurrent && (
            <span className="rounded-full bg-term-green/15 px-2 py-0.5 font-mono text-xs text-term-green">
              current
            </span>
          )}
        </div>
        <p style={{ color }} className="font-mono text-sm transition-colors duration-500">
          {job.company}
        </p>
        <p className="mt-1 font-mono text-xs text-term-muted">
          {job.location} · {formatDate(job.date_start)} – {formatDate(job.date_end)}
          {job.employment_type ? ` · ${job.employment_type}` : ""}
        </p>

        <ul className={`mt-4 space-y-2 text-sm text-term-muted ${isRight ? "md:text-right" : ""}`}>
          {job.description.map((line, i) => (
            <li key={i} className="leading-relaxed">
              {line}
            </li>
          ))}
        </ul>

        {job.technologies && job.technologies.length > 0 && (
          <div className={`mt-4 flex flex-wrap gap-2 ${isRight ? "md:justify-end" : ""}`}>
            {job.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-xs text-term-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
