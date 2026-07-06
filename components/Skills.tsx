"use client";

import { motion } from "framer-motion";
import type { Education, Skills as SkillsType } from "@/lib/types";
import SectionHeading from "./SectionHeading";

const CATEGORY_LABELS: Record<string, string> = {
  languages: "Languages",
  frameworks: "Frameworks",
  databases: "Databases",
  cloud: "Cloud",
  devops: "DevOps",
  data: "Data",
  soft_skills: "Soft Skills",
};

export default function Skills({ skills, education }: { skills: SkillsType; education: Education }) {
  const categories = Object.entries(skills).filter(
    ([, values]) => Array.isArray(values) && values.length > 0
  ) as [string, string[]][];

  return (
    <section id="skills" className="relative py-28">
      <div className="container-page">
        <SectionHeading eyebrow="$ cat skills.json" title="Skills & Achievements" />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            {categories.map(([key, values], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass rounded-xl p-5 shadow-glass"
              >
                <p className="font-mono text-xs uppercase tracking-wide text-term-green">
                  {CATEGORY_LABELS[key] ?? key}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {values.map((v) => (
                    <span
                      key={v}
                      className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-xs text-term-muted"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="glass h-fit rounded-xl p-6 shadow-glass"
          >
            <p className="font-mono text-xs uppercase tracking-wide text-term-green">Education</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{education.institution}</h3>
            <p className="mt-1 text-sm text-term-muted">
              {education.degree}, {education.major}
            </p>
            <p className="mt-1 font-mono text-xs text-term-muted">
              Expected graduation: {education.expected_graduation}
            </p>

            {education.awards && education.awards.length > 0 && (
              <div className="mt-5 border-t border-bg-border pt-4">
                <p className="font-mono text-xs uppercase tracking-wide text-term-muted">Awards</p>
                <ul className="mt-2 space-y-1.5">
                  {education.awards.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-term-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
