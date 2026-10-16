import { extractSkills } from "@/features/skills/skills";

import type { Job } from "./schemas";

export interface JobMatch {
  job: Job;
  /** 0 to 100, what the UI shows. */
  score: number;
  similarity: number;
  /** 0 to 100: share of the job's skills the resume lists. */
  coverage: number;
  /** 0 to 100: cosine similarity scaled to the range resumes reach. */
  semantic: number;
  matched: string[];
  missing: string[];
}

const STOP = new Set(
  "a an and are as at be by for from has have in is it its of on or our that the this to we will with you your who what work team role experience years job".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

type Vector = Map<string, number>;

function termFrequencies(tokens: string[]): Vector {
  const tf: Vector = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function cosine(a: Vector, b: Vector): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [t, w] of a) {
    na += w * w;
    dot += w * (b.get(t) ?? 0);
  }
  for (const w of b.values()) nb += w * w;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * rankJobs embeds the resume and every job as TF-IDF vectors over the job
 * corpus, then blends cosine similarity with skill coverage.
 * ponytail: sparse TF-IDF in memory, O(jobs x terms). Swap in dense
 * embeddings plus pgvector when the corpus outgrows one request.
 */
export function rankJobs(resume: string, jobs: Job[], limit = 25): JobMatch[] {
  const docs = jobs.map((j) =>
    termFrequencies(tokenize(`${j.title} ${j.title} ${j.tags.join(" ")} ${j.description}`)),
  );
  const df = new Map<string, number>();
  for (const doc of docs) for (const t of doc.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) => Math.log((1 + docs.length) / (1 + (df.get(t) ?? 0))) + 1;
  const weigh = (tf: Vector): Vector =>
    new Map([...tf].map(([t, n]) => [t, (1 + Math.log(n)) * idf(t)]));

  const resumeVector = weigh(termFrequencies(tokenize(resume)));
  const resumeSkills = new Set(extractSkills(resume));

  return jobs
    .map((job, i) => {
      const similarity = cosine(resumeVector, weigh(docs[i] ?? new Map<string, number>()));
      const jobSkills = extractSkills(`${job.title} ${job.tags.join(" ")} ${job.description}`);
      const matched = jobSkills.filter((s) => resumeSkills.has(s));
      const missing = jobSkills.filter((s) => !resumeSkills.has(s));
      const coverage = jobSkills.length ? matched.length / jobSkills.length : 0;
      // Cosine between a resume and a job post rarely passes 0.4, so scale it.
      const semantic = Math.min(1, similarity / 0.35);
      const score = Math.round(100 * (0.55 * coverage + 0.45 * semantic));
      return {
        job,
        score,
        similarity,
        coverage: Math.round(100 * coverage),
        semantic: Math.round(100 * semantic),
        matched,
        missing,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
