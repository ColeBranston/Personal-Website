"use client";

import { Github, Linkedin, Mail } from "lucide-react";
import type { PersonalInfo } from "@/lib/types";

export default function Footer({ personal }: { personal: PersonalInfo }) {
  return (
    <footer id="contact" className="border-t border-bg-border py-16">
      <div className="container-page flex flex-col items-center gap-6 text-center">
        <p className="font-mono text-sm text-term-green">$ echo &quot;let&apos;s build something&quot;</p>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Get in touch</h2>
        <p className="max-w-md text-sm text-term-muted">
          Open to new opportunities and interesting problems. Reach out any time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-sm">
          <a
            href={`mailto:${personal.email}`}
            className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-medium text-black hover:bg-accent-bright"
          >
            <Mail size={16} /> {personal.email}
          </a>
          {personal.linkedin && (
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-bg-border px-5 py-2.5 text-term-muted hover:border-accent hover:text-accent-bright"
            >
              <Linkedin size={16} /> LinkedIn
            </a>
          )}
          <a
            href="https://github.com/ColeBranston"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-bg-border px-5 py-2.5 text-term-muted hover:border-accent hover:text-accent-bright"
          >
            <Github size={16} /> GitHub
          </a>
        </div>

        <p className="mt-8 font-mono text-xs text-term-muted">
          © {new Date().getFullYear()} {personal.name}. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}
