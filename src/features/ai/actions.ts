"use server";

import { z } from "zod";

import { fetchJobs } from "@/features/jobs/sources";
import { MAX_RESUME_CHARS } from "@/features/resume/text";

import { complete } from "./openrouter";

export type TailorState =
  { text: string; model: string; error: null } | { text: null; error: string };

const inputSchema = z.object({
  resume: z.string().trim().min(100, "Add your resume first.").max(MAX_RESUME_CHARS),
  jobId: z.string().min(1).max(200),
  mode: z.enum(["tailor", "cover"]),
});

export type TailorMode = z.infer<typeof inputSchema>["mode"];

const TAILOR = `You are an expert technical recruiter and ATS resume writer.
Given a resume and a job post, reply in plain text with exactly these sections:

FIT SUMMARY
Two sentences on how well the candidate fits and the biggest gap.

REWRITTEN BULLETS
Rewrite the 4 most relevant resume bullets to mirror the job's language. Keep every fact true: never invent employers, numbers or skills. One per line, starting with "- ".

KEYWORDS TO ADD
Comma-separated keywords from the job the candidate plausibly has but did not state.

No markdown headings, no preamble.`;

const COVER = `You are an expert career coach. Write a cover letter for this candidate and job.
Under 220 words, three short paragraphs, plain text, addressed "Dear Hiring Team,".
Open with why this role and company, then two concrete achievements from the resume that match the job, then a short close.
Use only facts from the resume: never invent employers, numbers or skills. Sign off with the candidate's name from the resume.`;

const SYSTEMS: Record<TailorMode, string> = { tailor: TAILOR, cover: COVER };

/**
 * tailorResume asks an LLM to tailor the resume to one job ("tailor") or to
 * write a cover letter for it ("cover"). The job text is
 * looked up server-side by id, so the prompt never carries client-written
 * job content. ponytail: no rate limit; add one per IP before a public launch.
 */
export async function tailorResume(
  resume: string,
  jobId: string,
  mode: TailorMode = "tailor",
): Promise<TailorState> {
  const parsed = inputSchema.safeParse({ resume, jobId, mode });
  if (!parsed.success)
    return { text: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const job = (await fetchJobs()).jobs.find((j) => j.id === parsed.data.jobId);
  if (!job) return { text: null, error: "That job is no longer listed. Run the match again." };

  try {
    const { text, model } = await complete(
      SYSTEMS[parsed.data.mode],
      `JOB: ${job.title} at ${job.company}\n${job.description.slice(0, 5000)}\n\nRESUME:\n${parsed.data.resume}`,
    );
    return { text, model, error: null };
  } catch (error) {
    console.error(
      JSON.stringify({ event: "tailor_failed", mode, jobId: job.id, error: String(error) }),
    );
    return { text: null, error: "The AI model is busy or unavailable. Try again in a minute." };
  }
}
