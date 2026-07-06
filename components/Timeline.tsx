"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import type { WorkExperience } from "@/lib/types";
import { brandColor, DEFAULT_BRAND_COLOR, withAlpha } from "@/lib/color";
import TimelineItem from "./TimelineItem";
import SectionHeading from "./SectionHeading";

export default function Timeline({ experience }: { experience: WorkExperience[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.2", "end 0.8"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Raw config colors are re-tuned into curated, theme-consistent shades —
  // same hue the user picked, but guaranteed to look good on a dark bg.
  const colors = useMemo(
    () => experience.map((job) => brandColor(job.primary_color)),
    [experience]
  );

  // Single source of truth for "which entry is active", derived directly
  // from scroll progress. Previously each card ran its own IntersectionObserver
  // and independently told the parent to update the color — but React always
  // fires effects in fixed top-to-bottom component order regardless of scroll
  // direction, so when two adjacent cards were briefly both "in view" during
  // a transition, the lower one always won, which only matched intent when
  // scrolling down. Deriving one shared index from scroll position instead
  // means the line and every card's glow can never disagree.
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const lastIndex = colors.length - 1;
    if (lastIndex < 0) return;
    const idx = Math.min(lastIndex, Math.max(0, Math.round(latest * lastIndex)));
    setActiveIndex(idx);
  });

  const activeColor = colors[activeIndex] ?? DEFAULT_BRAND_COLOR;

  return (
    <section id="experience" className="relative py-28">
      <div className="container-page">
        <SectionHeading eyebrow="$ git log --oneline" title="Work Experience" />

        <div ref={containerRef} className="relative mt-16">
          {/* Track */}
          <div className="absolute left-4 top-0 h-full w-0.5 -translate-x-1/2 bg-bg-border md:left-1/2" />
          {/* Progress fill */}
          <motion.div
            style={{
              height: lineHeight,
              backgroundColor: activeColor,
              boxShadow: `0 0 20px ${withAlpha(activeColor, 0.55)}`,
            }}
            className="absolute left-4 top-0 w-0.5 -translate-x-1/2 transition-colors duration-500 ease-out md:left-1/2"
          />

          <div className="flex flex-col gap-16">
            {experience.map((job, i) => (
              <TimelineItem
                key={`${job.company}-${job.date_start}`}
                job={job}
                index={i}
                color={colors[i]}
                isActive={i === activeIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
