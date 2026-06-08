export type MilestoneDraft = {
  id: string;
  title: string;
  tasks: string[];
  isApproved: boolean;
};

const OVERVIEW_SECTION = "overview";

function flushMilestone(
  title: string | null,
  tasks: string[],
  milestones: MilestoneDraft[],
) {
  if (!title || title.toLowerCase() === OVERVIEW_SECTION) {
    return;
  }

  milestones.push({
    id: `milestone-${milestones.length}`,
    title,
    tasks: [...tasks],
    isApproved: false,
  });
}

export function parseMilestoneDrafts(content: string): MilestoneDraft[] {
  const milestones: MilestoneDraft[] = [];
  const lines = content.split("\n");
  let currentTitle: string | null = null;
  let currentTasks: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushMilestone(currentTitle, currentTasks, milestones);
      currentTitle = headingMatch[1].trim();
      currentTasks = [];
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch && currentTitle) {
      currentTasks.push(numberedMatch[1].trim());
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && currentTitle) {
      currentTasks.push(bulletMatch[1].trim());
    }
  }

  flushMilestone(currentTitle, currentTasks, milestones);
  return milestones;
}

export function getCompilingMilestoneId(
  drafts: MilestoneDraft[],
  isStreaming: boolean,
): string | null {
  if (!isStreaming || drafts.length === 0) {
    return null;
  }
  return drafts[drafts.length - 1]?.id ?? null;
}
