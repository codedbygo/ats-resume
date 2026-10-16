import { describe, expect, it } from "vitest";

import { SAMPLE_RESUME } from "@/features/resume/sample";

import { scoreResume } from "./score";

describe("scoreResume", () => {
  it("scores the sample as good but with fixes left", () => {
    const result = scoreResume(SAMPLE_RESUME);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.score).toBeLessThan(90);
    expect(result.checks.filter((c) => c.tip).map((c) => c.id)).toEqual([
      "contact",
      "verbs",
      "metrics",
    ]);
    expect(result.checks.every((c) => c.points <= c.max)).toBe(true);
  });

  // Regression: the year range "2021 - 2023" counted as a phone number.
  it("does not read a date range as a phone number", () => {
    const contact = (text: string) =>
      scoreResume(text).checks.find((c) => c.id === "contact")?.points;

    expect(contact("a@b.co\nEngineer (2021 - 2023)")).toBe(3);
    expect(contact("a@b.co | +91 98765 43210")).toBe(7);
    expect(contact("a@b.co | (415) 555-0134")).toBe(7);
  });

  it("scores an empty resume zero with a tip on every check", () => {
    const result = scoreResume("");

    expect(result.score).toBe(0);
    expect(result.checks.every((c) => c.tip !== null)).toBe(true);
  });

  it("lists the job's keywords the resume lacks", () => {
    const job = "We need Python, Kafka, Terraform and React experience.";

    const result = scoreResume(SAMPLE_RESUME, job);

    expect(result.missingKeywords).toEqual(["Kafka", "Terraform"]);
    expect(result.checks.find((c) => c.id === "keywords")?.points).toBe(13);
  });

  it("names the missing section headings in the tip", () => {
    const result = scoreResume("Skills\nPython");

    expect(result.checks.find((c) => c.id === "sections")?.tip).toContain("Experience, Education");
  });
});
