import { describe, expect, it } from "vitest";

import { skillGaps } from "./insights";

describe("skillGaps", () => {
  it("ranks missing skills by how many jobs ask for them, ties alphabetical", () => {
    const matches = [
      { missing: ["Kafka", "Go"] },
      { missing: ["Kafka", "Terraform"] },
      { missing: ["Go", "Kafka"] },
    ];

    expect(skillGaps(matches)).toEqual([
      { skill: "Kafka", jobs: 3 },
      { skill: "Go", jobs: 2 },
      { skill: "Terraform", jobs: 1 },
    ]);
  });

  it("honours the limit and handles no gaps", () => {
    expect(skillGaps([{ missing: ["A", "B", "C"] }], 2)).toHaveLength(2);
    expect(skillGaps([{ missing: [] }])).toEqual([]);
  });
});
