export interface SkillGap {
  skill: string;
  /** How many of the given jobs ask for this skill and the resume lacks it. */
  jobs: number;
}

/** skillGaps ranks the missing skills that would unlock the most matched jobs. */
export function skillGaps(matches: { missing: string[] }[], limit = 6): SkillGap[] {
  const counts = new Map<string, number>();
  for (const m of matches) for (const s of m.missing) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts]
    .map(([skill, jobs]) => ({ skill, jobs }))
    .sort((a, b) => b.jobs - a.jobs || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}
