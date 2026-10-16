# SwaraMatch

AI job matching and live ATS resume scoring, built as a prototype for a
SWARA application. Not an official SWARA product.

- **Resume intake**: upload a PDF (parsed server-side with `unpdf`) or paste text. Nothing is stored.
- **Live ATS score**: a deterministic scorer (`src/features/ats/score.ts`) runs in the browser on every
  keystroke: contact details, section headings, length, bullets, action verbs, quantified impact, keywords.
- **Job matching**: pulls live jobs from Remotive, Arbeitnow and RemoteOK (cached hourly, sample fallback),
  ranks them by TF-IDF cosine similarity plus skill coverage (`src/features/jobs/match.ts`) and shows
  matched skills and gaps per job. Pick a job to score the resume against its keywords.
- **Explainable scores**: every match shows skill coverage and semantic similarity separately.
- **Skill-gap insights**: the missing skills that would unlock the most of your matched jobs.
- **Filters**: search by title, company or location and set a minimum match.
- **AI tailoring and cover letters** (optional): with `OPENROUTER_API_KEY` set, rewrites the most relevant
  bullets or drafts a cover letter for one job, using free OpenRouter models with fallback. Never invents facts.
- **Export**: download the resume as .txt or print an ATS-safe single-column PDF.
- **Remembers your resume** in this browser only (localStorage); nothing is stored on a server.

Next steps beyond the prototype: dense embeddings in pgvector instead of in-memory TF-IDF, per-IP rate
limit on the AI action, saved profiles and job alerts.

Deploy: `vercel link --project swara-match`, `vercel env add OPENROUTER_API_KEY production`,
`vercel deploy --prod`.

Next.js app (App Router). `make help` lists every command; `make check` is
the gate.

## Run

```
cp .env.example .env.local
make setup          # pnpm install (writes pnpm-lock.yaml; commit it), Playwright chromium, git hooks
make dev            # http://localhost:3000
```

`make check` prints one `<gate>: N ... checked` line per gate (format,
lint, typecheck, unit tests, dependency audit) and a final tally. A gate
whose tool is missing prints `SKIPPED` and the tally fails;
`BEARING_ALLOW_SKIP=1 make check` lets a laptop through and is never set in CI.
`make build` and `make test-e2e` (Playwright against the production build)
are CI jobs, not part of `check`.

## Layout

See `AGENTS.md` and the `nextjs` skill for the conventions. `src/app`
holds the routes (`layout`, `page`, `loading`, `error`, `global-error`,
`not-found`, `api/*/route.ts`), `src/features/<feature>` owns a domain
(schemas, server-side `api`, server actions in `actions.ts`, components),
`src/components/ui` is shadcn output, `src/lib` holds the API client, auth
and `cn`, `src/env.ts` (public) and `src/env.server.ts` (server-only)
parse the environment, `src/proxy.ts` adds the request id, `e2e/`
holds Playwright specs.

## Server and client

A file is a server component unless it starts with `"use client"`.
`HealthCard` fetches on the server at request time, inside a `Suspense`
boundary; `FeedbackForm` is a client component because it needs
`useActionState`, and its server action validates with Zod after
`requireSession`.

## Caching

`cacheComponents` is on in `next.config.ts` (Next 16). Nothing is cached
unless a function says `"use cache"` with `cacheLife` and `cacheTag`; a
server action that changes the data calls `updateTag`. `src/lib/api.ts`
and `src/features/health/api.ts` show the pattern. The Next docs for the
installed version are in `node_modules/next/dist/docs/`.

## Add a shadcn component

```
pnpm dlx shadcn@latest add dialog
```

`src/components/ui/button.tsx` is the example the generator produced; files
in that folder are not linted and are regenerated, not hand-edited.

## Image

```
docker build --build-arg NEXT_PUBLIC_APP_NAME="SwaraPrototype" -t swara-prototype .
docker run --rm -p 3000:3000 -e API_URL=http://api:8080 swara-prototype
```
