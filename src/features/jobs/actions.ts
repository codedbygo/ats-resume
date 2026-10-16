"use server";

import { z } from "zod";

import { MAX_RESUME_CHARS } from "@/features/resume/text";

import { rankJobs } from "./match";
import { fetchJobs } from "./sources";

export interface MatchView {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string | null;
  score: number;
  coverage: number;
  semantic: number;
  matched: string[];
  missing: string[];
  /** Trimmed post text: enough for the ATS keyword check, not the whole page. */
  description: string;
}

export type MatchState =
  | { matches: MatchView[]; scanned: number; live: boolean; boards: string[]; error: null }
  | { matches: null; error: string };

const resumeSchema = z
  .string()
  .trim()
  .min(100, "Add your resume first: at least a few lines.")
  .max(MAX_RESUME_CHARS, "That resume is too long; trim it under 30,000 characters.");

/** findMatches scans every board and returns the best jobs for this resume. */
export async function findMatches(resumeText: string): Promise<MatchState> {
  const parsed = resumeSchema.safeParse(resumeText);
  if (!parsed.success) {
    return { matches: null, error: parsed.error.issues[0]?.message ?? "Invalid resume." };
  }
  const feed = await fetchJobs();
  const matches = rankJobs(parsed.data, feed.jobs).map(
    ({ job, score, coverage, semantic, matched, missing }) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      source: job.source,
      postedAt: job.postedAt,
      score,
      coverage,
      semantic,
      matched,
      missing,
      description: job.description.slice(0, 2500),
    }),
  );
  return {
    matches,
    scanned: feed.jobs.length,
    live: feed.live,
    boards: feed.sources.filter((s) => s.count > 0).map((s) => s.name),
    error: null,
  };
}
