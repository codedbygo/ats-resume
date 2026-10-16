import { afterEach, describe, expect, it, vi } from "vitest";

import { SEED_JOBS } from "@/features/jobs/seed";
import { SAMPLE_RESUME } from "@/features/resume/sample";

import { tailorResume } from "./actions";

const env = vi.hoisted(() => {
  const value: { OPENROUTER_API_KEY: string | undefined; OPENROUTER_MODELS: string[] } = {
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_MODELS: ["model-a:free", "model-b:free"],
  };
  return value;
});
vi.mock("@/env.server", () => ({ serverEnv: env }));
vi.mock("@/features/jobs/sources", () => ({
  fetchJobs: vi.fn(() => Promise.resolve({ jobs: SEED_JOBS, live: false, sources: [] })),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  env.OPENROUTER_API_KEY = "test-key";
});

function stubOpenRouter(response: Response) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("tailorResume", () => {
  it("sends the job and resume to OpenRouter with model fallbacks", async () => {
    const fetchMock = stubOpenRouter(
      Response.json({
        model: "model-a:free",
        choices: [{ message: { content: "FIT SUMMARY\nStrong." } }],
      }),
    );

    const state = await tailorResume(SAMPLE_RESUME, "sample-ai-eng");

    expect(state).toEqual({ text: "FIT SUMMARY\nStrong.", model: "model-a:free", error: null });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    const body = JSON.parse(init.body) as {
      models: string[];
      messages: { content: string }[];
    };
    expect(body.models).toEqual(["model-a:free", "model-b:free"]);
    expect(body.messages[1]?.content).toContain("AI Engineer, Matching at Northwind AI");
  });

  it("uses the cover letter prompt in cover mode", async () => {
    const fetchMock = stubOpenRouter(
      Response.json({ choices: [{ message: { content: "Dear Hiring Team," } }] }),
    );

    const state = await tailorResume(SAMPLE_RESUME, "sample-ai-eng", "cover");

    expect(state).toEqual({ text: "Dear Hiring Team,", model: "unknown", error: null });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    expect(init.body).toContain("cover letter");
  });

  it("rejects an unknown mode", async () => {
    expect(
      (await tailorResume(SAMPLE_RESUME, "sample-ai-eng", "poem" as "cover")).error,
    ).toBeTruthy();
  });

  it("refuses an unknown job id without calling the model", async () => {
    const fetchMock = stubOpenRouter(Response.json({}));

    const state = await tailorResume(SAMPLE_RESUME, "nope");

    expect(state.error).toContain("no longer listed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the model fails", async () => {
    stubOpenRouter(new Response("rate limited", { status: 429 }));

    expect((await tailorResume(SAMPLE_RESUME, "sample-ai-eng")).error).toContain(
      "busy or unavailable",
    );
  });

  it("returns a friendly error when no key is configured", async () => {
    env.OPENROUTER_API_KEY = undefined;
    stubOpenRouter(Response.json({}));

    expect((await tailorResume(SAMPLE_RESUME, "sample-ai-eng")).error).toContain(
      "busy or unavailable",
    );
  });

  it("rejects an empty resume", async () => {
    expect((await tailorResume("", "sample-ai-eng")).error).toBe("Add your resume first.");
  });
});
