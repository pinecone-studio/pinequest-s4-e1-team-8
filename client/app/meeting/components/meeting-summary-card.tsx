"use client";

import { parseMeetingSummary } from "../utils/parse-meeting-summary";

type MeetingSummaryCardProps = {
  description?: string;
  summary?: string | null;
  title?: string;
};

type SummaryListProps = {
  emptyLabel: string;
  items: string[];
  title: string;
};

const SummaryList = ({ emptyLabel, items, title }: SummaryListProps) => (
  <div className="space-y-1.5">
    <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
      {title}
    </h4>
    {items.length ? (
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li
            className="flex items-start gap-2 text-sm text-zinc-200"
            key={`${title}-${index}`}
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400/70" />
            <span className="min-w-0 flex-1">{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-zinc-500">{emptyLabel}</p>
    )}
  </div>
);

export const MeetingSummaryCard = ({
  description = "AI-generated topics, decisions, and action items",
  summary,
  title = "Meeting summary",
}: MeetingSummaryCardProps) => {
  const content = parseMeetingSummary(summary);

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#11101a] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>

      {!content ? (
        <p className="text-sm text-zinc-400">No meeting summaries yet</p>
      ) : (
        <div className="space-y-4">
          <SummaryList
            emptyLabel="No main topics captured"
            items={content.mainTopics}
            title="Main topics"
          />
          <SummaryList
            emptyLabel="No key decisions captured"
            items={content.keyDecisions}
            title="Key decisions"
          />
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Action items
            </h4>
            {content.actionItems.length ? (
              <ul className="space-y-1.5">
                {content.actionItems.map((item, index) => (
                  <li
                    className="flex min-w-0 items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200"
                    key={`action-item-${index}`}
                  >
                    <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200 ring-1 ring-violet-400/20">
                      {item.owner}
                    </span>
                    <span className="min-w-0 flex-1">{item.action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No action items captured</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
