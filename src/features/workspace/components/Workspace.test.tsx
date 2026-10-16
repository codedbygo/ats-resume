import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MatchView } from "@/features/jobs/actions";

import { writeResume } from "@/features/resume/storage";

import { Workspace } from "./Workspace";

const match: MatchView = {
  id: "j1",
  title: "AI Engineer",
  company: "Acme",
  location: "Remote",
  url: "https://jobs.example/j1",
  source: "Remotive",
  postedAt: "2026-10-01T00:00:00Z",
  score: 87,
  coverage: 67,
  semantic: 100,
  matched: ["Python", "RAG"],
  missing: ["Kafka"],
  description: "Python, RAG and Kafka.",
};

const actions = vi.hoisted(() => ({
  findMatches: vi.fn(),
  tailorResume: vi.fn(),
  parseResume: vi.fn(),
}));
vi.mock("@/features/jobs/actions", () => ({ findMatches: actions.findMatches }));
vi.mock("@/features/ai/actions", () => ({ tailorResume: actions.tailorResume }));
vi.mock("@/features/resume/actions", () => ({ parseResume: actions.parseResume }));

afterEach(() => {
  writeResume("");
});

describe("Workspace", () => {
  it("scores the sample live, finds jobs, scores against one and tailors it", async () => {
    const user = userEvent.setup();
    actions.findMatches.mockResolvedValue({
      matches: [match],
      scanned: 240,
      live: true,
      boards: ["Remotive", "RemoteOK"],
      error: null,
    });
    actions.tailorResume.mockResolvedValue({
      text: "FIT SUMMARY\nGreat fit.",
      model: "m:free",
      error: null,
    });
    render(<Workspace aiEnabled />);

    expect(screen.getByRole("button", { name: "Find matching jobs" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Try a sample" }));
    expect(
      await screen.findByRole("img", { name: /ATS score [1-9]\d out of 100/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Find matching jobs" }));
    expect(
      await screen.findByText(/Scanned 240 live jobs from Remotive, RemoteOK/),
    ).toBeInTheDocument();
    const card = screen.getByRole("heading", { name: "AI Engineer" }).closest("li");
    if (!card) throw new Error("job card not rendered");
    expect(within(card).getByText("87%")).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: /ATS check vs this job/ }));
    expect(screen.getByText("AI Engineer at Acme")).toBeInTheDocument();
    expect(
      screen.getByText(/Add the job's keywords you genuinely have: Kafka/),
    ).toBeInTheDocument();

    await user.click(within(card).getByRole("button", { name: /Tailor with AI/ }));
    expect(await screen.findByText(/Great fit/)).toBeInTheDocument();
    expect(actions.tailorResume).toHaveBeenCalledWith(
      expect.stringContaining("Alex Rivera"),
      "j1",
      "tailor",
    );

    await user.click(screen.getByRole("button", { name: "Score generally" }));
    expect(screen.queryByText("AI Engineer at Acme")).not.toBeInTheDocument();
  });

  it("restores a saved resume, shows gaps, filters jobs and writes a cover letter", async () => {
    const user = userEvent.setup();
    writeResume("Saved resume from last visit with Python and RAG experience.");
    const other = { ...match, id: "j2", title: "Data Analyst", company: "Beta", score: 25 };
    actions.findMatches.mockResolvedValue({
      matches: [match, other],
      scanned: 2,
      live: true,
      boards: ["Remotive"],
      error: null,
    });
    actions.tailorResume.mockResolvedValue({
      text: "Dear Hiring Team,",
      model: "m:free",
      error: null,
    });
    render(<Workspace aiEnabled />);

    expect(screen.getByRole("textbox", { name: "Resume text" })).toHaveValue(
      "Saved resume from last visit with Python and RAG experience.",
    );
    await user.click(screen.getByRole("button", { name: "Find matching jobs" }));
    const gaps = await screen.findByRole("region", { name: /Skills that unlock more/ });
    expect(within(gaps).getByText("Kafka")).toBeInTheDocument();
    expect(within(gaps).getByText("2 jobs")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "50");
    expect(screen.queryByRole("heading", { name: "Data Analyst" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "0");
    await user.type(screen.getByRole("searchbox", { name: "Filter jobs" }), "nothing like this");
    expect(screen.getByText("No jobs match these filters.")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "Filter jobs" }));

    const card = screen.getByRole("heading", { name: "AI Engineer" }).closest("li");
    if (!card) throw new Error("job card not rendered");
    await user.click(within(card).getByRole("button", { name: /Cover letter/ }));
    expect(await within(card).findByText("Cover letter draft")).toBeInTheDocument();
    expect(actions.tailorResume).toHaveBeenLastCalledWith(expect.any(String), "j1", "cover");
  });

  it("hides AI tailoring when no model key is configured", async () => {
    const user = userEvent.setup();
    actions.findMatches.mockResolvedValue({
      matches: [match],
      scanned: 8,
      live: false,
      boards: [],
      error: null,
    });
    render(<Workspace aiEnabled={false} />);

    await user.click(screen.getByRole("button", { name: "Try a sample" }));
    await user.click(screen.getByRole("button", { name: "Find matching jobs" }));

    expect(await screen.findByText(/these are sample jobs/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tailor with AI/ })).not.toBeInTheDocument();
  });

  it("shows the match error and the tailoring error", async () => {
    const user = userEvent.setup();
    actions.findMatches.mockResolvedValueOnce({ matches: null, error: "Add your resume first." });
    render(<Workspace aiEnabled />);

    await user.type(screen.getByRole("textbox", { name: "Resume text" }), "short");
    await user.click(screen.getByRole("button", { name: "Find matching jobs" }));

    expect(await screen.findByText("Add your resume first.")).toBeInTheDocument();
  });

  it("loads an uploaded resume into the editor", async () => {
    const user = userEvent.setup();
    actions.parseResume.mockResolvedValue({ text: "Parsed resume text from PDF", error: null });
    render(<Workspace aiEnabled={false} />);

    await user.upload(
      screen.getByLabelText("Upload resume (PDF or .txt)"),
      new File(["%PDF"], "cv.pdf", { type: "application/pdf" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Resume text" })).toHaveValue(
        "Parsed resume text from PDF",
      );
    });
  });

  it("shows an upload error", async () => {
    const user = userEvent.setup();
    actions.parseResume.mockResolvedValue({ text: null, error: "Upload a PDF or a .txt file." });
    render(<Workspace aiEnabled={false} />);

    await user.upload(
      screen.getByLabelText("Upload resume (PDF or .txt)"),
      new File(["x"], "cv.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload a PDF or a .txt file.");
  });
});
