import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cole Branston — Software Engineer",
  description:
    "Portfolio of Cole Branston, a software engineering student and intern working across backend systems, data pipelines, and AI-powered tooling.",
  metadataBase: new URL("https://colebranston.github.io"),
  openGraph: {
    title: "Cole Branston — Software Engineer",
    description:
      "Portfolio of Cole Branston, a software engineering student and intern working across backend systems, data pipelines, and AI-powered tooling.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-bg font-sans antialiased selection:bg-accent/30">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-pattern bg-[size:42px_42px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_40%,transparent_100%)]" />
        {children}
      </body>
    </html>
  );
}
