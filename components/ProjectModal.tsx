"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github, X } from "lucide-react";
import type { Project, RepoCommitData } from "@/lib/types";
import { normalizeImageUrl, parseRepoLink } from "@/lib/repo";
import CommitGraph from "./CommitGraph";
import CommitList from "./CommitList";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const parsed = project.link ? parseRepoLink(project.link) : null;
  const ogImage = parsed
    ? `https://opengraph.githubassets.com/1/${parsed.owner}/${parsed.name}`
    : null;
  const coverImage = project.cover_image ? normalizeImageUrl(project.cover_image) : ogImage;

  const [commitData, setCommitData] = useState<RepoCommitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!project.link) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCommitData(null);

    const repoParam = encodeURIComponent(project.link);

    fetch(`/api/commits?repo=${repoParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load commits");
        return res.json();
      })
      .then((data: RepoCommitData) => {
        if (cancelled) return;
        // Show the cached (or freshly-fetched-if-uncached) copy immediately.
        setCommitData(data);
        setLoading(false);

        // Then, silently check GitHub in the background. If the live data
        // differs from what's cached, the API updates the cache and hands
        // back the fresh copy — swap it in. If nothing changed, do nothing.
        fetch(`/api/commits?repo=${repoParam}&revalidate=1`)
          .then((res) => (res.ok ? res.json() : null))
          .then((fresh: (RepoCommitData & { changed: boolean }) | null) => {
            if (!cancelled && fresh?.changed) setCommitData(fresh);
          })
          .catch(() => {
            // Revalidation is best-effort; the cached copy already on screen is fine.
          });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load commit history");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project.link]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 py-6 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 shadow-glass"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {coverImage && (
          <div className="relative h-36 w-full border-b border-bg-border bg-bg-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={`${project.name} preview`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-panel to-transparent" />
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white">{project.name}</h3>
              <p className="font-mono text-sm text-accent-bright">{project.type}</p>
            </div>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-bg-border px-3 py-1.5 font-mono text-xs text-term-muted hover:border-accent hover:text-accent-bright"
              >
                <Github size={14} /> Repo <ExternalLink size={12} />
              </a>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-term-muted">{project.description}</p>

          {project.features && project.features.length > 0 && (
            <div className="mt-5">
              <p className="font-mono text-xs uppercase tracking-wide text-term-muted">Features</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-term-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.technologies && project.technologies.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-xs text-term-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {project.metrics && (
            <div className="mt-5 flex gap-4 font-mono text-xs text-term-muted">
              {Object.entries(project.metrics).map(([k, v]) => (
                <span key={k}>
                  <span className="text-term-green">{v}</span> {k.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {project.link && (
            <div className="mt-8 border-t border-bg-border pt-6">
              <p className="font-mono text-xs uppercase tracking-wide text-term-muted">
                Commit activity
              </p>

              {loading && (
                <p className="mt-3 font-mono text-xs text-term-muted">Fetching commit history…</p>
              )}
              {error && <p className="mt-3 font-mono text-xs text-term-red">{error}</p>}

              {commitData && (
                <div className="mt-4 space-y-6">
                  {commitData.stale && (
                    <p className="font-mono text-xs text-term-yellow">
                      Showing cached data — live GitHub fetch failed.
                    </p>
                  )}
                  <CommitGraph weeklyActivity={commitData.weeklyActivity} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-left font-mono text-xs text-term-muted">
                    {commitData.commits[0]?.date && (
                      <span>
                        Last commit:{" "}
                        <span className="text-term-green">
                          {new Date(commitData.commits[0].date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    )}
                    {commitData.totalCommitCount != null && (
                      <span>
                        commits:{" "}
                        <span className="text-term-green">
                          {commitData.totalCommitCount.toLocaleString()}
                        </span>
                      </span>
                    )}
                    {commitData.totalLines != null && (
                      <span>
                        <span className="text-term-green">
                          {commitData.totalLines.toLocaleString()}
                        </span>{" "}
                        lines of code
                      </span>
                    )}
                  </div>
                  <CommitList commits={commitData.commits} />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
