"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#about", label: "about" },
  { href: "#experience", label: "experience" },
  { href: "#projects", label: "projects" },
  { href: "#skills", label: "skills" },
  { href: "#contact", label: "contact" },
];

export default function Nav({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "glass-strong border-white/10 shadow-glass" : "border-transparent bg-transparent"
      }`}
    >
      <nav className="container-page flex h-14 items-center justify-between font-mono text-sm">
        <a href="#top" className="flex items-center gap-2 text-bg-border">
          <span className="text-term-green">➜</span>
          <span className="text-term-muted">~/</span>
          <span className="text-accent-bright">{name.toLowerCase().replace(/\s+/g, "-")}</span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-term-muted transition-colors hover:text-accent-bright"
            >
              ./{l.label}
            </a>
          ))}
        </div>

        <button
          className="text-term-muted md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="glass-strong border-t border-bg-border px-6 pb-4 font-mono text-sm md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-term-muted hover:text-accent-bright"
            >
              ./{l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
