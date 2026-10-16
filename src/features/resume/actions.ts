"use server";

import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";

import { normalizeResumeText } from "./text";

export type ParseState = { text: string; error: null } | { text: null; error: string } | null;

const fileSchema = z
  .instanceof(File, { message: "Choose a file to upload." })
  .refine((f) => f.size > 0, "The file is empty.")
  .refine((f) => f.size <= 5 * 1024 * 1024, "Keep the file under 5 MB.")
  .refine(
    (f) => f.type === "application/pdf" || f.type === "text/plain" || /\.(pdf|txt)$/i.test(f.name),
    "Upload a PDF or a .txt file.",
  );

/**
 * parseResume turns an uploaded PDF or text file into plain resume text.
 * Anonymous by design: nothing is stored, the text goes back to the caller.
 */
export async function parseResume(_prev: ParseState, formData: FormData): Promise<ParseState> {
  const parsed = fileSchema.safeParse(formData.get("resume"));
  if (!parsed.success) {
    return { text: null, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  }
  const file = parsed.data;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    // mergePages would collapse every newline; join the pages ourselves.
    const raw = isPdf
      ? (await extractText(await getDocumentProxy(bytes))).text.join("\n")
      : new TextDecoder().decode(bytes);
    const text = normalizeResumeText(raw);
    if (text.length < 50) {
      return {
        text: null,
        error: "No readable text found. Is it a scanned image? Paste the text instead.",
      };
    }
    return { text, error: null };
  } catch (error) {
    console.error(JSON.stringify({ event: "resume_parse_failed", error: String(error) }));
    return { text: null, error: "Could not read that file. Paste the text instead." };
  }
}
