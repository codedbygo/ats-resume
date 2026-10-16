import { describe, expect, it } from "vitest";

import { SAMPLE_RESUME } from "@/features/resume/sample";

import { rankJobs } from "./match";
import type { Job } from "./schemas";

function job(id: string, title: string, description: string): Job {
  return {
    id,
    title,
    company: "Acme",
    location: "Remote",
    url: `https://jobs.example/${id}`,
    source: "test",
    tags: [],
    description,
    postedAt: null,
  };
}

const jobs = [
  job(
    "nurse",
    "Registered Nurse",
    "Patient care in a busy hospital ward. BLS certification required.",
  ),
  job(
    "ai",
    "AI Engineer",
    "Build RAG pipelines with LLMs, embeddings and pgvector in Python and TypeScript.",
  ),
  job("fe", "Frontend Engineer", "React, Next.js and TypeScript. Kafka and Terraform a plus."),
];

describe("rankJobs", () => {
  it("ranks the closest job first and the unrelated job last", () => {
    const ranked = rankJobs(SAMPLE_RESUME, jobs);

    expect(ranked.map((m) => m.job.id)).toEqual(["ai", "fe", "nurse"]);
    expect(ranked[2]?.score).toBeLessThan(20);
  });

  it("splits job skills into matched and missing", () => {
    const fe = rankJobs(SAMPLE_RESUME, jobs).find((m) => m.job.id === "fe");

    expect(fe?.matched).toEqual(["TypeScript", "React", "Next.js"]);
    expect(fe?.missing).toEqual(["Kafka", "Terraform"]);
    expect(fe?.coverage).toBe(60);
  });

  it("keeps scores within 0 to 100 and honours the limit", () => {
    const ranked = rankJobs(SAMPLE_RESUME, jobs, 2);

    expect(ranked).toHaveLength(2);
    expect(ranked.every((m) => m.score >= 0 && m.score <= 100)).toBe(true);
  });

  it("returns nothing for no jobs", () => {
    expect(rankJobs(SAMPLE_RESUME, [])).toEqual([]);
  });
});
