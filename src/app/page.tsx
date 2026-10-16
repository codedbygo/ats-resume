import { ArrowRight, Gauge, Radar, ShieldCheck, Sparkles, Wand2, Zap } from "lucide-react";

import { serverEnv } from "@/env.server";
import { Workspace } from "@/features/workspace/components/Workspace";

const STATS = [
  ["3", "live job boards"],
  ["7", "ATS checks"],
  ["< 1s", "rescoring"],
  ["$0", "no sign-up"],
] as const;

const STEPS = [
  {
    icon: Radar,
    title: "Scan every board",
    body: "Hundreds of live jobs from Remotive, Arbeitnow and RemoteOK, deduplicated and refreshed hourly.",
  },
  {
    icon: Gauge,
    title: "Score against your resume",
    body: "Each post becomes a TF-IDF vector and is ranked by cosine similarity plus skill coverage, with the skills you have and the gaps.",
  },
  {
    icon: Wand2,
    title: "Fix it for the ATS",
    body: "A live ATS score with a concrete fix per check, and AI rewrites that mirror one job's language without inventing facts.",
  },
] as const;

const PIPELINE = [
  ["Resume", "PDF parsed server-side with unpdf, or pasted text"],
  ["Live ATS scorer", "7 deterministic checks, rerun in the browser on every keystroke"],
  ["Job boards", "3 public APIs fetched in parallel, deduplicated, cached hourly"],
  ["Ranking", "TF-IDF vectors, cosine similarity and skill coverage"],
  ["LLM", "OpenRouter free models with fallback: tailoring and cover letters"],
] as const;

const STACK = [
  "Next.js 16 App Router",
  "React 19",
  "TypeScript strict",
  "Server Actions",
  "Cache Components",
  "Zod at every boundary",
  "Tailwind CSS v4",
  "Vitest + Testing Library",
  "Playwright e2e",
  "Vercel",
] as const;

// The index route. The hero is static; the workspace is client-side because
// the ATS score recomputes on every keystroke. Matching and AI run in server
// actions.
export default function HomePage() {
  const aiEnabled = Boolean(serverEnv.OPENROUTER_API_KEY);
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-4xl rounded-full bg-linear-to-r from-primary/25 to-brand-2/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl space-y-8 px-4 pt-16 pb-12 text-center sm:pt-24">
          <p className="mx-auto flex w-fit items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            AI job matching · Live ATS scoring · Free
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Stop searching.{" "}
            <span className="bg-linear-to-r from-primary to-brand-2 bg-clip-text text-transparent">
              Start matching.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-balance text-muted-foreground">
            Upload your resume once. We scan live job boards, score every post against your
            experience, and surface the best opportunities with exactly what to fix to beat the ATS.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#workspace"
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary to-brand-2 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:opacity-90"
            >
              <Zap className="size-4" aria-hidden /> Match my resume
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold shadow-sm transition hover:bg-muted"
            >
              How it works
            </a>
          </div>
          <dl className="mx-auto grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-sm sm:grid-cols-4">
            {STATS.map(([value, label]) => (
              <div key={label} className="bg-card px-4 py-4">
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-bold tracking-tight">{value}</dd>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16">
        <h2 className="sr-only">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="workspace"
        aria-label="Workspace"
        className="scroll-mt-16 border-y bg-muted/40 py-12"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Your matching workspace
              </h2>
              <p className="mt-1 text-muted-foreground">
                Drop in a resume or try the sample. Your resume stays in your browser.
              </p>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden />
              No account. Nothing stored on a server.
            </p>
          </div>
          <Workspace aiEnabled={aiEnabled} />
        </div>
      </section>
      <section id="tech" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Under the hood</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          How the matching engine works
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Deterministic where it can be, AI where it adds value. Scores are explainable: every match
          shows its skill coverage and semantic similarity, and the AI never invents facts.
        </p>
        <ol className="mt-8 grid gap-3 md:grid-cols-5">
          {PIPELINE.map(([title, body], i) => (
            <li key={title} className="relative rounded-2xl border bg-card p-4 shadow-sm">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              {i < PIPELINE.length - 1 && (
                <ArrowRight
                  className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-primary md:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tech stack">
          {STACK.map((t) => (
            <li
              key={t}
              className="rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-sm"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
