import type { MeetingDetailsActionItem, MeetingTranscriptSegment } from "@/app/meeting";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { AppUser } from "@/types";
import { MeetingNotesPanel } from "./meeting-notes-panel";
import { MeetingTopicPanel } from "./meeting-topic-panel";
import { MeetingTranscriptFeed } from "./meeting-transcript-feed";

type MeetingContentTabsProps = {
  segments: MeetingTranscriptSegment[];
  participants: AppUser[];
  summaryText: string | null;
  keyPoints: string[];
  actionItems: MeetingDetailsActionItem[];
  topics: string[];
};

const TAB_TRIGGER_CLASS = "data-active:text-violet-700 dark:data-active:text-violet-300";

export const MeetingContentTabs = ({
  segments,
  participants,
  summaryText,
  keyPoints,
  actionItems,
  topics,
}: MeetingContentTabsProps) => {
  return (
    <Tabs defaultValue="transcript" className="flex flex-1 flex-col gap-4">
      <TabsList className="w-fit shrink-0">
        <TabsTab value="transcript" className={TAB_TRIGGER_CLASS}>
          Transcript
        </TabsTab>
        <TabsTab value="notes" className={TAB_TRIGGER_CLASS}>
          Notes
        </TabsTab>
        <TabsTab value="topic" className={TAB_TRIGGER_CLASS}>
          Topic
        </TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="transcript" className="flex flex-1 flex-col">
        <MeetingTranscriptFeed segments={segments} participants={participants} />
      </TabsPanel>

      <TabsPanel value="notes" className="flex flex-1 flex-col">
        <MeetingNotesPanel summaryText={summaryText} keyPoints={keyPoints} actionItems={actionItems} />
      </TabsPanel>

      <TabsPanel value="topic" className="flex flex-1 flex-col">
        <MeetingTopicPanel topics={topics} segments={segments} />
      </TabsPanel>
    </Tabs>
  );
};
