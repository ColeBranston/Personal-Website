"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/lib/types";
import { normalizeImageUrl, parseRepoLink } from "@/lib/repo";

export default function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  const parsed = project.link ? parseRepoLink(project.link) : null;
  const ogImage = parsed
    ? `https://opengraph.githubassets.com/1/${parsed.owner}/${parsed.name}`
    : null;
  // An explicit cover_image from config always wins over the generic GitHub
  // repo-preview image; a github.com/.../blob/... link gets rewritten to the
  // raw file URL automatically since blob pages serve HTML, not image bytes.
  const coverImage = project.cover_image ? normalizeImageUrl(project.cover_image) : ogImage;

  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5 }}
      className="group glass relative flex flex-col overflow-hidden rounded-2xl text-left shadow-glass transition-shadow hover:shadow-glow"
    >
      {coverImage && (
        <div className="relative h-40 w-full overflow-hidden border-b border-bg-border bg-bg-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={`${project.name} preview`}
            className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-panel via-transparent to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
          <ArrowUpRight
            size={18}
            className="mt-1 shrink-0 text-term-muted transition-colors group-hover:text-accent-bright"
          />
        </div>
        <p className="font-mono text-xs text-accent-bright">{project.type}</p>
        <p className="mt-3 line-clamp-3 text-sm text-term-muted">{project.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(project.technologies ?? []).slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-xs text-term-muted"
            >
              {tech}
            </span>
          ))}
          {(project.technologies?.length ?? 0) > 4 && (
            <span className="rounded-md px-2 py-1 font-mono text-xs text-term-muted">
              +{(project.technologies?.length ?? 0) - 4}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          {project.metrics && (
            <div className="flex gap-3 font-mono text-xs text-term-muted">
              {Object.entries(project.metrics).map(([k, v]) => (
                <span key={k}>
                  <span className="text-term-green">{v}</span> {k.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          {parsed && (
            <Github
              size={16}
              className="ml-auto shrink-0 text-term-muted transition-colors duration-300 group-hover:text-accent-bright group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]"
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}
