"use client";

import { useMemo, useState } from "react";
import type { WeeklyActivity } from "@/lib/types";

function intensityClass(count: number, max: number): string {
  if (count === 0) return "bg-bg-elevated";
  const ratio = max === 0 ? 0 : count / max;
  if (ratio > 0.75) return "bg-term-green";
  if (ratio > 0.5) return "bg-term-green/70";
  if (ratio > 0.25) return "bg-term-green/45";
  return "bg-term-green/25";
}

export default function CommitGraph({ weeklyActivity }: { weeklyActivity: WeeklyActivity[] }) {
  const [hovered, setHovered] = useState<{ day: string; count: number } | null>(null);

  const { weeks, max } = useMemo(() => {
    const trimmed = weeklyActivity.slice(-26); // ~6 months, keeps it readable
    const max = trimmed.reduce(
      (m, w) => Math.max(m, ...w.days),
      0
    );
    return { weeks: trimmed, max };
  }, [weeklyActivity]);

  if (weeks.length === 0) {
    return (
      <p className="font-mono text-xs text-term-muted">
        No commit activity data available yet (GitHub may still be computing stats — try again
        shortly).
      </p>
    );
  }

  return (
    <div>
      <div className="flex w-full gap-1 pb-2">
        {weeks.map((week) => (
          <div key={week.weekStart} className="flex flex-1 flex-col gap-1">
            {week.days.map((count, dayIdx) => {
              const date = new Date(week.weekStart);
              date.setDate(date.getDate() + dayIdx);
              const label = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={dayIdx}
                  onMouseEnter={() => setHovered({ day: label, count })}
                  onMouseLeave={() => setHovered(null)}
                  className={`aspect-square w-full rounded-[2px] ${intensityClass(count, max)} transition-colors`}
                  title={`${count} commit${count === 1 ? "" : "s"} on ${label}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-term-muted">
        <span>
          {hovered ? `${hovered.count} commit${hovered.count === 1 ? "" : "s"} · ${hovered.day}` : "hover a cell for details"}
        </span>
        <span className="flex items-center gap-1">
          less
          <span className="h-3 w-3 rounded-[2px] bg-bg-elevated" />
          <span className="h-3 w-3 rounded-[2px] bg-term-green/25" />
          <span className="h-3 w-3 rounded-[2px] bg-term-green/45" />
          <span className="h-3 w-3 rounded-[2px] bg-term-green/70" />
          <span className="h-3 w-3 rounded-[2px] bg-term-green" />
          more
        </span>
      </div>
    </div>
  );
}
