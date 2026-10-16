// @vitest-environment node
// The action runs on the server; jsdom's File lacks arrayBuffer.
import { describe, expect, it } from "vitest";

import { SAMPLE_RESUME } from "./sample";
import { parseResume } from "./actions";

function form(file: File | null): FormData {
  const data = new FormData();
  if (file) data.set("resume", file);
  return data;
}

describe("parseResume", () => {
  it("reads a text file", async () => {
    const file = new File([SAMPLE_RESUME], "cv.txt", { type: "text/plain" });

    const state = await parseResume(null, form(file));

    expect(state?.text).toContain("Alex Rivera");
  });

  it("asks for a file when none is sent", async () => {
    expect(await parseResume(null, form(null))).toEqual({
      text: null,
      error: "Choose a file to upload.",
    });
  });

  it("rejects other file types", async () => {
    const file = new File(["x"], "cv.docx", { type: "application/msword" });

    expect((await parseResume(null, form(file)))?.error).toBe("Upload a PDF or a .txt file.");
  });

  it("explains a file with no readable text", async () => {
    const file = new File(["short"], "cv.txt", { type: "text/plain" });

    expect((await parseResume(null, form(file)))?.error).toContain("No readable text");
  });

  it("reports an unreadable PDF without throwing", async () => {
    const file = new File(["not really a pdf"], "cv.pdf", { type: "application/pdf" });

    expect((await parseResume(null, form(file)))?.error).toBe(
      "Could not read that file. Paste the text instead.",
    );
  });
});
