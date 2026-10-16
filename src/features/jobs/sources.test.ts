import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJobs, htmlToText } from "./sources";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const remotiveBody = {
  jobs: [
    {
      id: 1,
      url: "https://remotive.com/1",
      title: "AI Engineer",
      company_name: "Acme",
      tags: ["python"],
      candidate_required_location: "Worldwide",
      description: "<p>Build <b>RAG</b> &amp; LLMs</p>",
      publication_date: "2026-10-01T00:00:00",
    },
  ],
};
const arbeitnowBody = {
  data: [
    {
      slug: "dup",
      url: "https://arbeitnow.com/dup",
      title: "AI Engineer",
      company_name: "Acme",
      tags: [],
      location: "Berlin",
      remote: true,
      description: "dup",
      created_at: 1760000000,
    },
  ],
};
const remoteOkBody = [
  { legal: "notice" },
  {
    id: "9",
    url: "https://remoteok.com/9",
    position: "Go Developer",
    company: "Gopher",
    tags: ["golang"],
    location: "",
    description: "Golang",
    date: null,
  },
];

function stubFetch(bodies: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const host = new URL(url).hostname;
      const body = bodies[host];
      return Promise.resolve(
        body === undefined ? new Response("down", { status: 503 }) : Response.json(body),
      );
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("htmlToText", () => {
  it("strips tags and decodes entities", () => {
    expect(htmlToText("<ul><li>A &amp; B</li><li>C</li></ul><script>x()</script>")).toBe(
      "A & B\nC",
    );
  });
});

describe("fetchJobs", () => {
  it("merges every board, dedupes by title and company, skips the legal notice", async () => {
    stubFetch({
      "remotive.com": remotiveBody,
      "www.arbeitnow.com": arbeitnowBody,
      "remoteok.com": remoteOkBody,
    });

    const feed = await fetchJobs();

    expect(feed.live).toBe(true);
    expect(feed.jobs.map((j) => j.id)).toEqual(["remotive-1", "remoteok-9"]);
    expect(feed.jobs[0]?.description).toBe("Build RAG & LLMs");
    expect(feed.jobs[1]?.location).toBe("Remote");
  });

  it("keeps the other boards when one fails and reports it", async () => {
    stubFetch({ "remotive.com": remotiveBody });

    const feed = await fetchJobs();

    expect(feed.jobs).toHaveLength(1);
    expect(feed.sources.find((s) => s.name === "RemoteOK")?.error).toContain("503");
  });

  it("falls back to sample jobs when every board fails", async () => {
    stubFetch({});

    const feed = await fetchJobs();

    expect(feed.live).toBe(false);
    expect(feed.jobs.every((j) => j.source === "Sample")).toBe(true);
  });
});
