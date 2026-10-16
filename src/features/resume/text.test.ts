import { describe, expect, it } from "vitest";

import { MAX_RESUME_CHARS, normalizeResumeText } from "./text";

describe("normalizeResumeText", () => {
  it("puts inline bullets on their own lines", () => {
    expect(normalizeResumeText("Experience • Built X • Led Y")).toBe(
      "Experience\n• Built X\n• Led Y",
    );
  });

  it("collapses blank runs and Windows line endings", () => {
    expect(normalizeResumeText("A\r\n\r\n\r\n\r\nB  \n")).toBe("A\n\nB");
  });

  it("caps the length", () => {
    expect(normalizeResumeText("x".repeat(MAX_RESUME_CHARS + 10))).toHaveLength(MAX_RESUME_CHARS);
  });
});
