import { extractSkills } from "@/features/skills/skills";

export interface AtsCheck {
  id: string;
  label: string;
  points: number;
  max: number;
  tip: string | null;
}

export interface AtsResult {
  score: number;
  checks: AtsCheck[];
  missingKeywords: string[];
}

const ACTION_VERBS =
  /^(led|built|designed|developed|created|launched|shipped|improved|increased|reduced|optimi[sz]ed|automated|implemented|architected|migrated|delivered|managed|owned|drove|scaled|mentored|deployed|integrated|refactored|analy[sz]ed|streamlined|spearheaded|established|engineered|wrote|reworked|cut|grew|saved)\b/i;
const SECTIONS: [string, RegExp][] = [
  ["Experience", /^\s*(work\s+)?(experience|employment|professional experience|work history)\b/im],
  ["Education", /^\s*education\b/im],
  ["Skills", /^\s*(technical\s+)?skills\b/im],
  ["Summary or Projects", /^\s*(summary|profile|objective|about|projects?)\b/im],
];

function check(id: string, label: string, max: number, ratio: number, tip: string): AtsCheck {
  const points = Math.round(max * Math.min(1, Math.max(0, ratio)));
  return { id, label, points, max, tip: points < max ? tip : null };
}

// A phone number has 10+ digits on one line; "2021 - 2023" is a date range.
function hasPhone(text: string): boolean {
  return (text.match(/\+?\(?\d[\d \t().-]{8,}\d/g) ?? []).some(
    (m) => m.replace(/\D/g, "").length >= 10,
  );
}

function bulletLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-•*▪◦●]\s*/.test(l))
    .map((l) => l.replace(/^[-•*▪◦●]\s*/, ""));
}

/**
 * scoreResume grades plain resume text the way an ATS parser sees it.
 * With a job description it also scores keyword coverage against it.
 */
export function scoreResume(text: string, jobDescription = ""): AtsResult {
  const words = text.split(/\s+/).filter(Boolean).length;
  const bullets = bulletLines(text);
  const verbBullets = bullets.filter((b) => ACTION_VERBS.test(b)).length;
  const numberBullets = bullets.filter((b) => /\d/.test(b)).length;
  const foundSections = SECTIONS.filter(([, re]) => re.test(text));
  const contact = [
    /[\w.+-]+@[\w-]+\.[\w.]+/.test(text),
    hasPhone(text),
    /(linkedin\.com|github\.com)/i.test(text),
  ].filter(Boolean).length;
  const resumeSkills = extractSkills(text);
  const jobSkills = jobDescription ? extractSkills(jobDescription) : [];
  const missingKeywords = jobSkills.filter((s) => !resumeSkills.includes(s));
  const lengthRatio = words < 250 ? words / 250 : words > 1000 ? 1000 / words : 1;
  const missingSections = SECTIONS.filter(([name]) => !foundSections.some(([f]) => f === name))
    .map(([name]) => name)
    .join(", ");

  const checks = [
    check(
      "contact",
      "Contact details",
      10,
      contact / 3,
      "Add email, phone and a LinkedIn or GitHub URL.",
    ),
    check(
      "sections",
      "Standard section headings",
      15,
      foundSections.length / SECTIONS.length,
      `Add clear headings ATS parsers look for: ${missingSections}.`,
    ),
    check("length", "Length", 10, lengthRatio, "Aim for 250 to 1000 words (one to two pages)."),
    check(
      "bullets",
      "Bullet points",
      10,
      bullets.length / 8,
      "Write experience as bullet points, at least 8 across your roles.",
    ),
    check(
      "verbs",
      "Action verbs",
      15,
      bullets.length ? verbBullets / bullets.length / 0.8 : 0,
      "Start most bullets with a strong verb: built, led, reduced, shipped.",
    ),
    check(
      "metrics",
      "Quantified impact",
      15,
      bullets.length ? numberBullets / bullets.length / 0.7 : 0,
      "Put a number in most bullets (70%+): %, $, users, latency.",
    ),
    jobSkills.length
      ? check(
          "keywords",
          "Keywords from the job",
          25,
          (jobSkills.length - missingKeywords.length) / jobSkills.length,
          `Add the job's keywords you genuinely have: ${missingKeywords.slice(0, 8).join(", ")}.`,
        )
      : check(
          "keywords",
          "Skill keywords",
          25,
          resumeSkills.length / 12,
          "List concrete tools and technologies (aim for 12+) in a Skills section.",
        ),
  ];

  return {
    score: checks.reduce((sum, c) => sum + c.points, 0),
    checks,
    missingKeywords,
  };
}
