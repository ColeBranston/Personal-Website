"use client";

import { GitCommitHorizontal } from "lucide-react";
import type { CommitSummary } from "@/lib/types";

export default function CommitList({ commits }: { commits: CommitSummary[] }) {
  if (commits.length === 0) {
    return <p className="font-mono text-xs text-term-muted">No commits found.</p>;
  }

  return (
    <ul className="divide-y divide-bg-border rounded-lg border border-bg-border">
      {commits.map((c) => (
        <li key={c.sha}>
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-bg-elevated"
          >
            <GitCommitHorizontal size={14} className="mt-1 shrink-0 text-term-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{c.message}</p>
              <p className="mt-0.5 font-mono text-[11px] text-term-muted">
                {c.author} ·{" "}
                {c.date
                  ? new Date(c.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "unknown date"}{" "}
                · <span className="text-accent-bright">{c.shortSha}</span>
              </p>
            </div>
            <div className="shrink-0 whitespace-nowrap font-mono text-[11px]">
              <span className="text-term-green">+{c.additions}</span>{" "}
              <span className="text-term-red">-{c.deletions}</span>
              <span className="ml-2 text-term-muted">{c.filesChanged} files</span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
