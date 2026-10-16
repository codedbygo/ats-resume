"use client";

import { FileText, LoaderCircle, Radar, RotateCcw, Upload, Wand2 } from "lucide-react";
import { useActionState, useDeferredValue, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { tailorResume, type TailorState } from "@/features/ai/actions";
import { scoreResume } from "@/features/ats/score";
import { findMatches, type MatchState } from "@/features/jobs/actions";
import { parseResume, type ParseState } from "@/features/resume/actions";
import { SAMPLE_RESUME } from "@/features/resume/sample";
import { cn } from "@/lib/utils";

import { AtsPanel } from "./AtsPanel";
import { JobCard } from "./JobCard";

function JobSkeleton() {
  return (
    <li className="animate-pulse rounded-2xl border bg-card p-5 shadow-sm" aria-hidden>
      <div className="flex items-start gap-4">
        <div className="size-11 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
        <div className="size-14 rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-16 rounded-xl bg-muted" />
    </li>
  );
}

/** Workspace is the whole flow: resume in, live ATS score, ranked jobs, AI tailoring. */
export function Workspace({ aiEnabled }: { aiEnabled: boolean }) {
  const [resume, setResume] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tailorFor, setTailorFor] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [parsed, uploadAction, uploading] = useActionState(
    async (prev: ParseState, form: FormData) => {
      const result = await parseResume(prev, form);
      if (result?.text) setResume(result.text);
      return result;
    },
    null,
  );
  const [matchState, matchAction, matching] = useActionState(
    (_prev: MatchState | null, text: string) => findMatches(text),
    null,
  );
  const [tailorState, tailorAction, tailoring] = useActionState(
    (_prev: TailorState | null, input: { resume: string; jobId: string }) =>
      tailorResume(input.resume, input.jobId),
    null,
  );
  const [, startTransition] = useTransition();

  const matches = matchState?.matches ?? [];
  const selected = matches.find((m) => m.id === selectedId) ?? null;
  const deferredResume = useDeferredValue(resume);
  const ats = scoreResume(deferredResume, selected?.description);
  const words = resume.split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:sticky lg:top-20 lg:col-span-5">
        <section
          aria-labelledby="resume-heading"
          className="overflow-hidden rounded-2xl border bg-card shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h2 id="resume-heading" className="flex items-center gap-2 font-semibold">
              <FileText className="size-4 text-primary" aria-hidden /> Your resume
            </h2>
            <div className="flex gap-2">
              <form action={uploadAction}>
                <label htmlFor="resume-file" className="sr-only">
                  Upload resume (PDF or .txt)
                </label>
                <input
                  ref={fileInput}
                  id="resume-file"
                  name="resume"
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="sr-only"
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <Upload aria-hidden />
                  )}
                  {uploading ? "Reading" : "Upload PDF"}
                </Button>
              </form>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setResume(SAMPLE_RESUME);
                }}
              >
                Try a sample
              </Button>
              {resume && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label="Clear resume"
                  onClick={() => {
                    setResume("");
                    setSelectedId(null);
                  }}
                >
                  <RotateCcw aria-hidden />
                </Button>
              )}
            </div>
          </div>
          {parsed?.error && (
            <p
              role="alert"
              className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {parsed.error}
            </p>
          )}
          <label htmlFor="resume-text" className="sr-only">
            Resume text
          </label>
          <textarea
            id="resume-text"
            value={resume}
            onChange={(e) => {
              setResume(e.target.value);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => {
              setDragging(false);
            }}
            onDrop={(e) => {
              setDragging(false);
              const input = fileInput.current;
              if (!input || e.dataTransfer.files.length === 0) return;
              e.preventDefault();
              input.files = e.dataTransfer.files;
              input.form?.requestSubmit();
            }}
            placeholder={
              "Drop your resume PDF here, upload it, or paste the text.\n\nThen edit it and watch the ATS score move as you type."
            }
            rows={14}
            className={cn(
              "block w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:font-sans focus-visible:bg-primary/5",
              dragging && "bg-primary/10",
            )}
          />
          <p className="flex justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{words} words</span>
            <span>Stays in this tab. Never stored.</span>
          </p>
        </section>

        <AtsPanel
          result={ats}
          jobLabel={selected ? `${selected.title} at ${selected.company}` : null}
          onClearJob={() => {
            setSelectedId(null);
          }}
        />
      </div>

      <section aria-labelledby="jobs-heading" className="space-y-4 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <h2 id="jobs-heading" className="flex items-center gap-2 font-semibold">
              <Radar className="size-4 text-primary" aria-hidden /> Best-fit jobs
            </h2>
            <div role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {matching && "Scanning live job boards and scoring each post against your resume."}
              {!matching && matchState?.error && (
                <span className="text-destructive">{matchState.error}</span>
              )}
              {!matching &&
                matchState?.matches &&
                (matchState.live
                  ? `Scanned ${String(matchState.scanned)} live jobs from ${matchState.boards.join(", ")}. Top ${String(matches.length)} below.`
                  : "Live boards are unreachable right now, so these are sample jobs.")}
              {!matching && !matchState && "Remotive, Arbeitnow and RemoteOK, ranked for you."}
            </div>
          </div>
          <Button
            onClick={() => {
              startTransition(() => {
                matchAction(resume);
              });
            }}
            disabled={matching || resume.trim().length === 0}
            className="bg-linear-to-r from-primary to-brand-2 text-white shadow-md shadow-primary/20 hover:opacity-90"
          >
            {matching ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Radar aria-hidden />
            )}
            {matching ? "Scanning boards" : matchState ? "Rescan jobs" : "Find matching jobs"}
          </Button>
        </div>

        {matching && (
          <ol className="space-y-3">
            <JobSkeleton />
            <JobSkeleton />
            <JobSkeleton />
          </ol>
        )}

        {!matching && matches.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/15 to-brand-2/15 text-primary">
              <Wand2 className="size-6" aria-hidden />
            </span>
            <p className="mt-4 font-semibold">Your matches will appear here</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {resume.trim()
                ? "Hit Find matching jobs to scan hundreds of live posts and rank them against your resume."
                : "Add your resume, or click Try a sample to see it work in one click."}
            </p>
          </div>
        )}

        {!matching && (
          <ol className="space-y-3">
            {matches.map((m, i) => (
              <JobCard
                key={m.id}
                match={m}
                rank={i + 1}
                selected={m.id === selectedId}
                aiEnabled={aiEnabled}
                tailor={tailorFor === m.id && !tailoring ? tailorState : null}
                tailoring={tailorFor === m.id && tailoring}
                onSelect={() => {
                  setSelectedId(m.id === selectedId ? null : m.id);
                }}
                onTailor={() => {
                  setTailorFor(m.id);
                  startTransition(() => {
                    tailorAction({ resume, jobId: m.id });
                  });
                }}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
