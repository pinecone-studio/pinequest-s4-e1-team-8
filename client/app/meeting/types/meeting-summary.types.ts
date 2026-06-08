export type MeetingSummaryActionItem = {
  action: string;
  owner: string;
};

export type MeetingSummaryContent = {
  actionItems: MeetingSummaryActionItem[];
  keyDecisions: string[];
  mainTopics: string[];
};
