/** MAX_RESUME_CHARS bounds what any action accepts; a long CV is ~15k. */
export const MAX_RESUME_CHARS = 30_000;

/**
 * normalizeResumeText puts inline bullets on their own lines (PDF text often
 * runs them together) and trims blank runs, so the ATS checks see lines.
 */
export function normalizeResumeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]*([•▪●◦])[ \t]*/g, "\n$1 ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_RESUME_CHARS);
}
