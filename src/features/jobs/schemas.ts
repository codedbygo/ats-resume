import { z } from "zod";

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  url: z.url(),
  source: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  postedAt: z.string().nullable(),
});

export type Job = z.infer<typeof jobSchema>;

// Upstream shapes, loose on purpose: only the fields we read, so a board
// adding fields never breaks the feed.
export const remotiveSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      url: z.url(),
      title: z.string(),
      company_name: z.string(),
      tags: z.array(z.string()).catch([]),
      candidate_required_location: z.string().catch("Remote"),
      description: z.string().catch(""),
      publication_date: z.string().nullable().catch(null),
    }),
  ),
});

export const arbeitnowSchema = z.object({
  data: z.array(
    z.object({
      slug: z.string(),
      url: z.url(),
      title: z.string(),
      company_name: z.string(),
      tags: z.array(z.string()).catch([]),
      location: z.string().catch(""),
      remote: z.boolean().catch(false),
      description: z.string().catch(""),
      created_at: z.number().nullable().catch(null),
    }),
  ),
});

export const remoteOkItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  url: z.url(),
  position: z.string(),
  company: z.string(),
  tags: z.array(z.string()).catch([]),
  location: z.string().catch("Remote"),
  description: z.string().catch(""),
  date: z.string().nullable().catch(null),
});
