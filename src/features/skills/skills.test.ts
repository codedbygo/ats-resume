import { describe, expect, it } from "vitest";

import { extractSkills } from "./skills";

describe("extractSkills", () => {
  it("maps aliases to canonical names", () => {
    expect(extractSkills("Built APIs in NodeJS and Postgres on k8s")).toEqual([
      "Node.js",
      "PostgreSQL",
      "Kubernetes",
    ]);
  });

  it("handles symbols in skill names", () => {
    expect(extractSkills("C++, C# and .NET")).toEqual(["C++", "C#", ".NET"]);
  });

  // Regression: "js" inside "Next.js" counted as JavaScript.
  it("does not read a framework suffix as its own skill", () => {
    expect(extractSkills("Next.js and Node.js")).toEqual(["Next.js", "Node.js"]);
  });

  it("does not match inside other words", () => {
    expect(extractSkills("javascript")).toEqual(["JavaScript"]);
    expect(extractSkills("reactive rustic nodes")).toEqual([]);
  });
});
