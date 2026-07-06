"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { PersonalInfo, Education, WorkExperience } from "@/lib/types";

function githubFromPortfolio(personal: PersonalInfo): string | null {
  if (personal.github) return personal.github;
  if (personal.portfolio?.includes("github.io")) {
    const user = personal.portfolio.match(/https?:\/\/([^.]+)\.github\.io/)?.[1];
    return user ? `https://github.com/${user}` : null;
  }
  return null;
}

export default function Hero({
  personal,
  education,
  currentRole,
}: {
  personal: PersonalInfo;
  education: Education;
  currentRole?: WorkExperience;
}) {
  const github = githubFromPortfolio(personal);
  const locationStr = [personal.location.city, personal.location.province, personal.location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <section id="top" className="relative flex min-h-screen items-center pt-24">
      <div className="container-page grid w-full items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="mb-3 font-mono text-sm text-term-green">$ whoami</p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {personal.name}
          </h1>
          <p className="prompt-caret mt-4 font-mono text-lg text-accent-bright sm:text-xl">
            {currentRole ? `${currentRole.title} @ ${currentRole.company}` : "Software Engineer"}
          </p>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-term-muted">
            {education.degree} in {education.major} at {education.institution}, expected{" "}
            {education.expected_graduation}. Building backend systems, data pipelines, and
            AI-powered developer tooling.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 font-mono text-sm">
            <a
              href="#projects"
              className="rounded-md bg-accent px-5 py-2.5 font-medium text-black transition-colors hover:bg-accent-bright"
            >
              View projects
            </a>
            <a
              href="#contact"
              className="rounded-md border border-bg-border px-5 py-2.5 text-term-muted transition-colors hover:border-accent hover:text-accent-bright"
            >
              Get in touch
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="glass rounded-xl shadow-glass"
        >
          <div className="flex items-center gap-1.5 border-b border-bg-border px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-term-red/70" />
            <span className="h-3 w-3 rounded-full bg-term-yellow/70" />
            <span className="h-3 w-3 rounded-full bg-term-green/70" />
            <span className="ml-3 font-mono text-xs text-term-muted">contact.json</span>
          </div>
          <div className="space-y-3 p-5 font-mono text-sm">
            <ContactRow icon={<MapPin size={15} />} label={locationStr} />
            <ContactRow
              icon={<Mail size={15} />}
              label={personal.email}
              href={`mailto:${personal.email}`}
            />
            {personal.phone && <ContactRow icon={<Phone size={15} />} label={personal.phone} />}
            {personal.linkedin && (
              <ContactRow
                icon={<Linkedin size={15} />}
                label="linkedin.com/in/cole-branston"
                href={personal.linkedin}
              />
            )}
            {github && <ContactRow icon={<Github size={15} />} label="github.com/ColeBranston" href={github} />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 text-term-muted transition-colors hover:text-accent-bright">
      <span className="text-accent">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return content;
}
