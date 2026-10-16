import { describe, expect, it, vi } from "vitest";

import { SAMPLE_RESUME } from "@/features/resume/sample";

import { findMatches } from "./actions";
import { SEED_JOBS } from "./seed";

vi.mock("./sources", () => ({
  fetchJobs: vi.fn(() =>
    Promise.resolve({
      jobs: SEED_JOBS,
      live: true,
      sources: [
        { name: "Remotive", count: 8, error: null },
        { name: "RemoteOK", count: 0, error: "503" },
      ],
    }),
  ),
}));

describe("findMatches", () => {
  it("rejects a resume that is too short", async () => {
    expect(await findMatches("hi")).toEqual({
      matches: null,
      error: "Add your resume first: at least a few lines.",
    });
  });

  it("ranks the AI and full-stack jobs above the unrelated ones", async () => {
    const state = await findMatches(SAMPLE_RESUME);

    expect(state.error).toBeNull();
    expect(
      state.matches
        ?.slice(0, 2)
        .map((m) => m.id)
        .sort(),
    ).toEqual(["sample-ai-eng", "sample-fs-ts"]);
    expect(state.matches?.at(-1)?.score).toBeLessThan(state.matches?.[0]?.score ?? 0);
  });

  it("reports how many jobs were scanned and which boards answered", async () => {
    const state = await findMatches(SAMPLE_RESUME);

    expect(state).toMatchObject({ scanned: SEED_JOBS.length, live: true, boards: ["Remotive"] });
  });
});
