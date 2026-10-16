import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { arbeitnowSchema, remoteOkItemSchema, remotiveSchema, type Job } from "./schemas";
import { SEED_JOBS } from "./seed";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** htmlToText flattens a job post's HTML into plain text for matching. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|div|li|br|h\d|ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, 6000);
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": "swara-match-prototype/0.1", accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`${url} answered ${String(res.status)}`);
  return res.json();
}

async function remotive(): Promise<Job[]> {
  const { jobs } = remotiveSchema.parse(
    await getJson("https://remotive.com/api/remote-jobs?limit=150"),
  );
  return jobs.map((j) => ({
    id: `remotive-${String(j.id)}`,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    url: j.url,
    source: "Remotive",
    tags: j.tags,
    description: htmlToText(j.description),
    postedAt: j.publication_date,
  }));
}

async function arbeitnow(): Promise<Job[]> {
  const { data } = arbeitnowSchema.parse(
    await getJson("https://www.arbeitnow.com/api/job-board-api"),
  );
  return data.map((j) => ({
    id: `arbeitnow-${j.slug}`,
    title: j.title,
    company: j.company_name,
    location: j.remote ? `Remote${j.location ? ` / ${j.location}` : ""}` : j.location,
    url: j.url,
    source: "Arbeitnow",
    tags: j.tags,
    description: htmlToText(j.description),
    postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  }));
}

async function remoteOk(): Promise<Job[]> {
  // The first element is a legal notice, not a job; parse items one by one.
  const items = z.array(z.unknown()).parse(await getJson("https://remoteok.com/api"));
  return items.flatMap((item) => {
    const j = remoteOkItemSchema.safeParse(item);
    if (!j.success) return [];
    return {
      id: `remoteok-${String(j.data.id)}`,
      title: j.data.position,
      company: j.data.company,
      location: j.data.location || "Remote",
      url: j.data.url,
      source: "RemoteOK",
      tags: j.data.tags,
      description: htmlToText(j.data.description),
      postedAt: j.data.date,
    };
  });
}

export interface JobFeed {
  jobs: Job[];
  live: boolean;
  sources: { name: string; count: number; error: string | null }[];
}

/**
 * fetchJobs pulls every board in parallel, dedupes by title and company,
 * and falls back to a bundled set when every board fails.
 */
export async function fetchJobs(): Promise<JobFeed> {
  "use cache";
  cacheTag("jobs");

  const boards = [
    ["Remotive", remotive],
    ["Arbeitnow", arbeitnow],
    ["RemoteOK", remoteOk],
  ] as const;
  const results = await Promise.allSettled(boards.map(([, load]) => load()));
  const sources = results.map((r, i) => ({
    name: boards[i]?.[0] ?? "unknown",
    count: r.status === "fulfilled" ? r.value.length : 0,
    error: r.status === "rejected" ? String(r.reason) : null,
  }));
  const seen = new Set<string>();
  const jobs = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((j) => {
      const key = `${j.title}|${j.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (jobs.length === 0) {
    // Retry the boards soon instead of pinning the fallback for hours.
    cacheLife("minutes");
    return { jobs: SEED_JOBS, live: false, sources };
  }
  cacheLife("hours");
  return { jobs, live: true, sources };
}
