"use client";

import { useResume } from "@/features/resume/storage";

/**
 * PrintResume is what "ATS-safe PDF" prints: the resume as one column of
 * plain text, no tables or images. It sits directly under <body> so print
 * CSS can hide everything else and let it flow across pages.
 */
export function PrintResume() {
  const resume = useResume();
  return (
    <div id="print-resume" className="hidden font-sans text-sm whitespace-pre-wrap">
      {resume}
    </div>
  );
}
