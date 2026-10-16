import { ExternalLink, LoaderCircle, MapPin, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TailorState } from "@/features/ai/actions";
import type { MatchView } from "@/features/jobs/actions";
import { cn } from "@/lib/utils";

import { scoreTone } from "./AtsPanel";

const AVATAR_TONES = [
  "bg-chart-1/15 text-chart-1",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
  "bg-primary/15 text-primary",
];

function initials(company: string): string {
  const words = company
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  return (
    words.length > 1 ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}` : company.slice(0, 2)
  ).toUpperCase();
}

function tone(company: string): string {
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? "";
}

function MatchRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  return (
    <div className={cn("relative size-14 shrink-0", scoreTone(score))}>
      <svg viewBox="0 0 44 44" className="size-full" aria-hidden>
        <circle cx="22" cy="22" r="18" className="fill-none stroke-muted" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r="18"
          className="fill-none stroke-current"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
        {score}%
      </span>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: "good" | "gap" }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li
          key={s}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            tone === "good"
              ? "bg-success/10 text-success"
              : "border border-dashed text-muted-foreground",
          )}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

/** JobCard is one ranked job with why it matched and what to do next. */
export function JobCard({
  match,
  rank,
  selected,
  aiEnabled,
  tailor,
  tailoring,
  onSelect,
  onTailor,
}: {
  match: MatchView;
  rank: number;
  selected: boolean;
  aiEnabled: boolean;
  tailor: TailorState | null;
  tailoring: boolean;
  onSelect: () => void;
  onTailor: () => void;
}) {
  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md",
        selected && "border-primary shadow-md ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            tone(match.company),
          )}
          aria-hidden
        >
          {initials(match.company)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="leading-snug font-semibold">{match.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{match.company}</span>
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{match.location}</span>
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            #{rank} best match · via {match.source}
            {match.postedAt && ` · ${new Date(match.postedAt).toLocaleDateString()}`}
          </p>
        </div>
        <MatchRing score={match.score} />
      </div>

      {(match.matched.length > 0 || match.missing.length > 0) && (
        <div className="mt-4 grid gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              You have ({match.matched.length})
            </p>
            {match.matched.length > 0 ? (
              <Chips items={match.matched} tone="good" />
            ) : (
              <p className="text-xs text-muted-foreground">No listed skills overlap yet.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Gaps ({match.missing.length})
            </p>
            {match.missing.length > 0 ? (
              <Chips items={match.missing} tone="gap" />
            ) : (
              <p className="text-xs text-success">No skill gaps. Apply.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selected ? "default" : "outline"}
          onClick={onSelect}
          aria-pressed={selected}
        >
          <Target aria-hidden /> ATS check vs this job
        </Button>
        {aiEnabled && (
          <Button
            size="sm"
            onClick={onTailor}
            disabled={tailoring}
            className="bg-linear-to-r from-primary to-brand-2 text-white hover:opacity-90"
          >
            {tailoring ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Sparkles aria-hidden />
            )}
            {tailoring ? "Tailoring" : "Tailor with AI"}
          </Button>
        )}
        <Button size="sm" variant="ghost" asChild className="ml-auto">
          <a href={match.url} target="_blank" rel="noopener noreferrer">
            View posting <ExternalLink aria-hidden />
          </a>
        </Button>
      </div>

      {tailor && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-brand-2/5 p-4 text-sm"
        >
          {tailor.error === null ? (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden /> Tailored for this job
              </p>
              <p className="leading-relaxed whitespace-pre-wrap">{tailor.text}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Generated by {tailor.model}. Check every line before you use it.
              </p>
            </>
          ) : (
            <p className="text-destructive">{tailor.error}</p>
          )}
        </div>
      )}
    </li>
  );
}
