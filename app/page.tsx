import { getSiteConfig } from "@/lib/config";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import AboutMe from "@/components/AboutMe";
import Timeline from "@/components/Timeline";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Footer from "@/components/Footer";

// Freshness is handled by our own Redis-backed cache in lib/config.ts, so
// this page always renders dynamically and just asks the cache layer for
// the latest config.
export const dynamic = "force-dynamic";

export default async function Home() {
  let config;
  try {
    config = await getSiteConfig();
  } catch (err) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center font-mono">
        <p className="text-term-red">$ error: failed to load site configuration</p>
        <p className="max-w-md text-sm text-term-muted">
          Could not reach the config.json source. Check CONFIG_URL and REDIS_URL in your
          environment, then reload.
        </p>
      </main>
    );
  }

  const currentRole =
    config.work_experience.find((job) => job.date_end.toLowerCase() === "present") ??
    config.work_experience[0];

  return (
    <main>
      <Nav name={config.personal.name} />
      <Hero personal={config.personal} education={config.education} currentRole={currentRole} />
      <AboutMe name={config.personal.name} />
      <Timeline experience={config.work_experience} />
      <Projects projects={config.projects} />
      <Skills skills={config.skills} education={config.education} />
      <Footer personal={config.personal} />
    </main>
  );
}
