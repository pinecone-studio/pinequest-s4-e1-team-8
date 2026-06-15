import type { MeetingDetailsActionItem } from "@/app/meeting";
import { ActionItemsChecklist } from "@/components/meetings/ActionItemsChecklist";

type MeetingNotesPanelProps = {
  summaryText: string | null;
  keyPoints: string[];
  actionItems: MeetingDetailsActionItem[];
};

export const MeetingNotesPanel = ({ summaryText, keyPoints, actionItems }: MeetingNotesPanelProps) => {
  if (!summaryText && keyPoints.length === 0 && actionItems.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No notes yet</p>
        <p className="text-sm text-muted-foreground">
          Notes will appear here once this meeting has been summarized.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {summaryText ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Summary</h3>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{summaryText}</p>
        </div>
      ) : null}

      {keyPoints.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">Key decisions</h3>
          <ul className="flex flex-col gap-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400" />
                <span className="min-w-0 flex-1 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Action items</h3>
        <ActionItemsChecklist items={actionItems} />
      </div>
    </div>
  );
};
