import { Check, Lightbulb, X } from "lucide-react";

import type { AtsResult } from "@/features/ats/score";
import { cn } from "@/lib/utils";

export function scoreTone(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

function verdict(score: number): string {
  if (score >= 90) return "Excellent: ready to send";
  if (score >= 70) return "Good: a few quick wins left";
  if (score >= 50) return "Fair: fix the items below";
  return "Needs work";
}

function ScoreDial({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-32 shrink-0"
      role="img"
      aria-label={`ATS score ${String(score)} out of 100`}
    >
      <defs>
        <linearGradient id="dial-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#dial-g)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform="rotate(-90 50 50)"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="26"
        fontWeight="700"
        className="fill-foreground"
      >
        {score}
      </text>
      <text x="50" y="68" textAnchor="middle" fontSize="9" className="fill-muted-foreground">
        out of 100
      </text>
    </svg>
  );
}

/** AtsPanel shows the live ATS score and what to fix, recomputed on every edit. */
export function AtsPanel({
  result,
  jobLabel,
  onClearJob,
}: {
  result: AtsResult;
  jobLabel: string | null;
  onClearJob: () => void;
}) {
  const fixes = result.checks.filter((c) => c.tip).length;
  const empty = result.score === 0;
  return (
    <section aria-labelledby="ats-heading" className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-6">
        <ScoreDial score={result.score} />
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Live ATS score
          </p>
          <h2
            id="ats-heading"
            className={cn("text-xl font-bold", empty ? "text-foreground" : scoreTone(result.score))}
          >
            {empty ? "Waiting for your resume" : verdict(result.score)}
          </h2>
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {jobLabel ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-0.5 pr-1 pl-3 text-foreground">
                <span className="truncate">
                  Scored against <span className="font-medium">{jobLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={onClearJob}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                  aria-label="Score generally"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </span>
            ) : (
              <p>
                {empty
                  ? "Seven checks run as you type: contact, sections, length, bullets, verbs, impact and keywords."
                  : fixes === 0
                    ? "Every check passes."
                    : `${String(fixes)} ${fixes === 1 ? "fix" : "fixes"} to go. Pick a job to score against its keywords.`}
              </p>
            )}
          </div>
        </div>
      </div>
      <ul className={cn("mt-6 divide-y", empty && "hidden")}>
        {result.checks.map((c) => (
          <li key={c.id} className="py-3 text-sm first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full",
                    c.tip ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
                  )}
                >
                  {c.tip ? (
                    <Lightbulb className="size-3" aria-hidden />
                  ) : (
                    <Check className="size-3" aria-hidden />
                  )}
                </span>
                {c.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {c.points}/{c.max}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  c.tip ? "bg-warning" : "bg-success",
                )}
                style={{ width: `${String((c.points / c.max) * 100)}%` }}
              />
            </div>
            {c.tip && <p className="mt-1.5 text-muted-foreground">{c.tip}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
